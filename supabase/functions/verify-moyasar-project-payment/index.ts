import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"GET,POST,OPTIONS"};
const json=(b:unknown,s=200)=>new Response(JSON.stringify(b),{status:s,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(!["GET","POST"].includes(req.method)) return json({error:"Method not allowed"},405);
 try{
  const supabaseUrl=Deno.env.get("SUPABASE_URL")!, serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, secret=Deno.env.get("MOYASAR_SECRET_KEY")||"";
  if(!secret.startsWith("sk_test_"))return json({error:"Moyasar test mode only: configure an sk_test_ secret key"},503);
  const db=createClient(supabaseUrl,serviceRole);
  const url=new URL(req.url); let body:any={};
  if(req.method==="POST") body=await req.json().catch(()=>({}));
  const paymentId=url.searchParams.get("id")||url.searchParams.get("payment_id")||body.id||body.payment_id||body.data?.id;
  if(!paymentId) return json({error:"payment_id is required"},400);
  const resp=await fetch("https://api.moyasar.com/v1/payments/"+encodeURIComponent(paymentId),{headers:{Authorization:"Basic "+btoa(secret+":"),Accept:"application/json"}});
  const p=await resp.json().catch(()=>({}));
  if(!resp.ok) return json({error:p?.message||"Moyasar verification failed"},502);
  const {data:pp,error:e}=await db.from("project_payments").select("id,project_id,milestone_id,amount,total_amount,currency,status,escrow_status").eq("gateway_reference",p.id).maybeSingle();
  if(e) return json({error:e.message},500);
  if(!pp) return json({error:"Project payment not found"},404);
  const expected=Math.round(Number(pp.total_amount ?? pp.amount)*100);
  if(p.currency!==pp.currency || Number(p.amount)!==expected) return json({error:"Payment amount or currency mismatch"},400);
  if(p.status==="refunded") return json({error:"Gateway refund requires finance reconciliation before changing escrow records",payment_id:p.id,project_payment_id:pp.id},409);
  if(p.status==="paid"){
    const {data:completion,error:completionError}=await db.rpc("complete_moyasar_project_payment",{p_project_payment_id:pp.id,p_moyasar_payment_id:p.id});
    if(completionError||!completion?.ok)return json({error:completionError?.message||"Escrow completion failed",payment_id:p.id,project_payment_id:pp.id},500);
    return json({verified:true,payment_id:p.id,status:p.status,paid:true,project_payment_id:pp.id,escrow:completion});
  }
  const nextStatus=p.status==="failed"?"failed":"pending";
  const {error:ue}=await db.from("project_payments").update({status:nextStatus,escrow_status:"pending",updated_at:new Date().toISOString()}).eq("id",pp.id).neq("escrow_status","held");
  if(ue) return json({error:ue.message},500);
  return json({verified:true,payment_id:p.id,status:p.status,paid:false,project_payment_id:pp.id});
 }catch(err){return json({error:String(err)},500);}
});