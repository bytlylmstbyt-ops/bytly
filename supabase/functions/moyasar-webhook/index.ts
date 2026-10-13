import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const headers = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json"};
const reply = (body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers});
 if(req.method!=="POST")return reply({error:"Method not allowed"},405);
 try {
  const body=await req.json().catch(()=>({}));
  const webhookSecret=Deno.env.get("MOYASAR_WEBHOOK_SECRET")||"";
  const secret=Deno.env.get("MOYASAR_SECRET_KEY")||"";
  if(!webhookSecret||body?.secret_token!==webhookSecret)return reply({error:"Unauthorized"},401);
  if(!secret.startsWith("sk_test_"))return reply({error:"Moyasar test mode only: configure an sk_test_ secret key"},503);
  const eventPayment=body?.data??{}, paymentId=eventPayment?.id;
  if(!paymentId||typeof paymentId!=="string")return reply({error:"Missing Moyasar payment ID"},400);
  // Treat the webhook as a notification only; verify status, amount and currency against Moyasar API.
  const gatewayResponse=await fetch("https://api.moyasar.com/v1/payments/"+encodeURIComponent(paymentId),{headers:{Authorization:"Basic "+btoa(secret+":"),Accept:"application/json"}});
  const payment=await gatewayResponse.json().catch(()=>({}));
  if(!gatewayResponse.ok||payment?.id!==paymentId)return reply({error:"Could not verify payment with Moyasar"},502);
  const url=Deno.env.get("SUPABASE_URL"), service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if(!url||!service)return reply({error:"Payment service is not configured"},503);
  const db=createClient(url,service,{auth:{autoRefreshToken:false,persistSession:false}});
  const {data:pp,error:ppe}=await db.from("project_payments").select("id,project_id,milestone_id,amount,total_amount,currency,status,escrow_status,gateway_reference").eq("gateway_reference",paymentId).maybeSingle();
  if(ppe)return reply({error:"Could not read project payment"},500);
  if(pp){
   if(payment.currency!==pp.currency||Number(payment.amount)!==Math.round(Number(pp.total_amount??pp.amount)*100))return reply({error:"Payment amount or currency mismatch"},400);
   if(payment.status==="paid"){
    const {data:result,error}=await db.rpc("complete_moyasar_project_payment",{p_project_payment_id:pp.id,p_moyasar_payment_id:paymentId});
    if(error||!result?.ok)return reply({error:"Payment verified; escrow reconciliation required",project_payment_id:pp.id},500);
    return reply({received:true,type:"project_escrow",completed:true,already_completed:!!result.already_completed});
   }
   if(["failed","voided"].includes(payment.status)){
    const {error}=await db.from("project_payments").update({status:"failed",updated_at:new Date().toISOString()}).eq("id",pp.id).in("status",["initiated","pending"]);
    if(error)return reply({error:"Could not update failed project payment"},500);
   }
   // Refund events are deliberately not applied to escrow automatically.
   return reply({received:true,type:"project_escrow",status:payment.status});
  }
  const {data:wallet,error:we}=await db.from("wallet_transactions").select("id,user_id,amount,currency,status,reference,type").eq("reference",paymentId).eq("type","wallet_recharge").maybeSingle();
  if(we)return reply({error:"Could not read wallet order"},500);
  if(wallet){
   if(payment.currency!==wallet.currency||Number(payment.amount)!==Math.round(Number(wallet.amount)*100))return reply({error:"Payment amount or currency mismatch"},400);
   if(payment.status==="paid"){
    const {data:result,error}=await db.rpc("complete_wallet_recharge",{p_order_id:wallet.id,p_user_id:wallet.user_id,p_payment_id:paymentId});
    if(error||!result?.ok)return reply({error:"Payment verified; wallet reconciliation required"},500);
    return reply({received:true,type:"wallet_recharge",completed:true,already_completed:!!result.already_completed});
   }
   if(["failed","voided"].includes(payment.status)){
    const {error}=await db.from("wallet_transactions").update({status:"failed"}).eq("id",wallet.id).eq("status","pending");
    if(error)return reply({error:"Could not update failed wallet order"},500);
   }
   return reply({received:true,type:"wallet_recharge",status:payment.status});
  }
  const {data:sub,error:se}=await db.from("subscription_payments").select("id,amount,currency").eq("provider_payment_id",paymentId).maybeSingle();
  if(se)return reply({error:"Could not read subscription payment"},500);
  if(sub){
   if(payment.currency!==sub.currency||Number(payment.amount)!==Math.round(Number(sub.amount)*100))return reply({error:"Payment amount or currency mismatch"},400);
   const status=payment.status==="paid"?"completed":["failed","voided"].includes(payment.status)?"failed":"initiated";
   const {error}=await db.from("subscription_payments").update({status,paid_at:payment.status==="paid"?new Date().toISOString():null,updated_at:new Date().toISOString()}).eq("id",sub.id);
   if(error)return reply({error:"Could not update subscription payment"},500);
   return reply({received:true,type:"subscription",status:payment.status});
  }
  return reply({received:true,matched:false});
 } catch(error) {
  console.error("Moyasar webhook reconciliation failed",error);
  return reply({error:"Internal payment reconciliation error"},500);
 }
});