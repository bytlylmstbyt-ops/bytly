import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{...cors,"Content-Type":"application/json"}});
Deno.serve(async(req)=>{
 if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
 if(req.method!=="POST") return json({error:"Method not allowed"},405);
 const authHeader=req.headers.get("Authorization"); if(!authHeader)return json({error:"Unauthorized"},401);
 const supabaseUrl=Deno.env.get("SUPABASE_URL")!,anonKey=Deno.env.get("SUPABASE_ANON_KEY")!,serviceRole=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,moyasarSecret=Deno.env.get("MOYASAR_SECRET_KEY")!;
 const userClient=createClient(supabaseUrl,anonKey,{global:{headers:{Authorization:authHeader}}}),admin=createClient(supabaseUrl,serviceRole);
 const {data:{user},error:userError}=await userClient.auth.getUser(); if(userError||!user)return json({error:"Unauthorized"},401);
 const body=await req.json().catch(()=>({})); const {project_id,milestone_id,contract_id,payment_method="moyasar",source}=body;
 if(!project_id||!milestone_id)return json({error:"project_id and milestone_id are required"},400);
 const {data:milestone,error:milestoneError}=await admin.from("project_milestones").select("id,project_id,provider_user_id,provider_type,amount,status").eq("id",milestone_id).eq("project_id",project_id).single();
 if(milestoneError||!milestone)return json({error:"Project milestone not found"},404);
 const amount=Number(milestone.amount); if(!amount||amount<=0)return json({error:"Invalid milestone amount"},400);
 let contract:any=null;
 if(contract_id){ const {data:c}=await admin.from("project_contracts").select("id,project_id,client_user_id,provider_user_id,provider_type,status").eq("id",contract_id).eq("project_id",project_id).maybeSingle(); contract=c; }
 else { const {data:c}=await admin.from("project_contracts").select("id,project_id,client_user_id,provider_user_id,provider_type,status").eq("project_id",project_id).eq("provider_user_id",milestone.provider_user_id).order("created_at",{ascending:false}).limit(1).maybeSingle(); contract=c; }
 if(contract?.client_user_id && contract.client_user_id!==user.id)return json({error:"You are not authorized to fund this project"},403);
 if(milestone.provider_user_id===user.id)return json({error:"Service provider cannot fund own milestone"},403);
 const providerType=milestone.provider_type||"service_provider";
 if(!milestone.provider_user_id || milestone.provider_user_id===user.id)return json({error:"Valid service provider is required"},400);
 const {data:project,error:projectError}=await admin.from("projects").select("id,client_user_id,assigned_engineer_id").eq("id",project_id).maybeSingle();
 if(projectError||!project)return json({error:"Project not found"},404);
 if(project.client_user_id!==user.id)return json({error:"Only the project owner may fund this milestone"},403);
 if(contract_id && (!contract || contract.project_id!==project_id || contract.client_user_id!==user.id))return json({error:"Contract not found or not owned by the current user"},403);
 const {data:funded}=await admin.from("project_financial_milestones").select("id,escrow_status").eq("project_id",project_id).eq("milestone_id",milestone_id).in("escrow_status",["funded","held","partially_released","released"]).limit(1).maybeSingle();
 if(funded)return json({error:"Milestone already has a funded escrow",financial_milestone_id:funded.id},409);
 const vatRate=15, vatAmount=Math.round(amount*vatRate)/100, totalAmount=amount+vatAmount;
 let payment:any=null;
 const {data:pendingPayment}=await admin.from("project_payments").select("id,amount,currency,status,escrow_status,payee_user_id,provider_type,gateway_reference,total_amount").eq("project_id",project_id).eq("milestone_id",milestone_id).eq("payer_user_id",user.id).in("status",["initiated","pending"]).order("created_at",{ascending:false}).limit(1).maybeSingle();
 if(pendingPayment){payment=pendingPayment;}
 else {
  const {data:created,error:paymentError}=await admin.from("project_payments").insert({project_id,milestone_id,contract_id:contract?.id??null,payer_user_id:user.id,payee_user_id:milestone.provider_user_id,provider_type:providerType,amount,currency:"SAR",status:"initiated",payment_method,escrow_status:"pending",platform_fee:Math.round(amount*0.15)/100,provider_amount:amount-Math.round(amount*0.15)/100,taxable_amount:amount,vat_rate:vatRate,vat_amount:vatAmount,total_amount:totalAmount}).select("id,amount,currency,status,escrow_status,payee_user_id,provider_type,gateway_reference,total_amount").single();
  if(paymentError)return json({error:paymentError.message},500);
  payment=created;
 }
 if(!source)return json({payment_order_id:payment.id,amount:totalAmount,taxable_amount:amount,vat_amount:vatAmount,currency:"SAR",provider_user_id:milestone.provider_user_id,provider_type:providerType,requires_source:true});
 const auth="Basic "+btoa(moyasarSecret+":");
 const response=await fetch("https://api.moyasar.com/v1/payments",{method:"POST",headers:{"Authorization":auth,"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify({amount:Math.round(totalAmount*100),currency:"SAR",description:"Bytly project milestone "+milestone.id,callback_url:supabaseUrl+"/functions/v1/verify-moyasar-project-payment",source})});
 const moyasar=await response.json().catch(()=>({}));
 if(!response.ok){ await admin.from("project_payments").update({status:"failed",gateway_reference:moyasar?.id||null,updated_at:new Date().toISOString()}).eq("id",payment.id); return json({error:moyasar?.message||"Moyasar payment creation failed",payment_order_id:payment.id},502); }
 await admin.from("project_payments").update({gateway_reference:moyasar.id,status:"pending",escrow_status:"pending",updated_at:new Date().toISOString()}).eq("id",payment.id);
 if(moyasar.status==="paid"){
  const {data:completion,error:completionError}=await admin.rpc("complete_moyasar_project_payment",{p_project_payment_id:payment.id,p_moyasar_payment_id:moyasar.id});
  if(completionError||!completion?.ok)return json({error:"Payment received but escrow completion needs reconciliation",payment_id:moyasar.id,payment_order_id:payment.id},500);
 }
 return json({payment_order_id:payment.id,payment_id:moyasar.id,status:moyasar.status,amount:totalAmount,taxable_amount:amount,vat_amount:vatAmount,currency:"SAR"});
});