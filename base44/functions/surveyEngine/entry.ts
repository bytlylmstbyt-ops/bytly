import { createClientFromRequest } from 'npm:@base44/sdk@0.8.32';

const PLATFORM_COMMISSION = 0.15; // 15%

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calcPricing(areaSqm, propertyStatus) {
  const baseRate = propertyStatus === 'existing_building' ? 5 : 3; // SAR per sqm
  const minFee = 300;
  const maxFee = 5000;
  const raw = areaSqm * baseRate;
  return Math.max(minFee, Math.min(maxFee, Math.round(raw)));
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action } = body;

    // ══════════════════════════════════════════════════════════
    // CREATE — عميل ينشئ طلب مسح + قفل ضمان
    // ══════════════════════════════════════════════════════════
    if (action === 'create') {
      const { latitude, longitude, address, property_area_sqm, property_status, notes } = body;

      if (!latitude || !longitude || !property_area_sqm) {
        return Response.json({ error: 'الموقع والمساحة مطلوبان' }, { status: 400 });
      }

      const totalCharged = calcPricing(property_area_sqm, property_status);
      const platformFee = Math.round(totalCharged * PLATFORM_COMMISSION);
      const payoutAmount = totalCharged - platformFee;

      // Check client wallet
      const [client] = await base44.entities.Client.filter({ email: user.email });
      if (!client) return Response.json({ error: 'الرجاء إكمال ملف العميل أولاً' }, { status: 400 });
      if ((client.wallet_balance || 0) < totalCharged) {
        return Response.json({
          error: 'رصيد غير كافٍ',
          required: totalCharged,
          available: client.wallet_balance || 0
        }, { status: 400 });
      }

      // Deduct from wallet
      await base44.asServiceRole.entities.Client.update(client.id, {
        wallet_balance: (client.wallet_balance || 0) - totalCharged
      });

      // Record transaction
      await base44.asServiceRole.entities.Transaction.create({
        user_email: user.email,
        user_type: 'client',
        type: 'escrow_hold',
        amount: totalCharged,
        commission_amount: platformFee,
        net_amount: payoutAmount,
        status: 'held_in_escrow',
        description: `ضمان طلب مسح — ${address || 'موقع العقار'}`,
        balance_before: client.wallet_balance || 0,
        balance_after: (client.wallet_balance || 0) - totalCharged
      });

      // Create request
      const request = await base44.entities.SurveyRequest.create({
        client_id: client.id,
        client_email: user.email,
        client_name: user.full_name || client.full_name,
        latitude, longitude,
        address: address || '',
        property_area_sqm,
        property_status: property_status || 'vacant_land',
        notes: notes || '',
        status: 'pending',
        payout_amount: payoutAmount,
        platform_fee: platformFee,
        total_charged: totalCharged,
        commission_rate: PLATFORM_COMMISSION * 100,
        escrow_status: 'held'
      });

      // Find matching surveyors
      const allSurveyors = await base44.asServiceRole.entities.SurveyorProfile.filter({
        status: 'approved',
        is_available: true
      });

      const matched = [];
      for (const s of allSurveyors) {
        if (s.latitude == null || s.longitude == null) continue;
        const dist = haversineKm(latitude, longitude, s.latitude, s.longitude);
        const radius = s.geofencing_radius_km || 50;
        if (dist <= radius) {
          matched.push({ surveyor_id: s.id, name: s.full_name, distance_km: Math.round(dist * 100) / 100, notified: false });
        }
      }

      matched.sort((a, b) => a.distance_km - b.distance_km);

      if (matched.length > 0) {
        await base44.asServiceRole.entities.SurveyRequest.update(request.id, {
          status: 'broadcasted',
          matched_surveyors: matched
        });

        // Notify top 10 matching surveyors
        for (const m of matched.slice(0, 10)) {
          const [sv] = await base44.asServiceRole.entities.SurveyorProfile.filter({ id: m.surveyor_id });
          if (sv) {
            await base44.asServiceRole.entities.Notification.create({
              recipient_email: sv.email,
              title: '📍 طلب رفع مساحي جديد قريب منك!',
              message: `طلب مسح جديد على بعد ${m.distance_km} كم منك. مساحة ${property_area_sqm} م². المبلغ: ${payoutAmount} ريال.`,
              type: 'system',
              priority: 'high'
            });
          }
        }
      }

      return Response.json({
        success: true,
        request_id: request.id,
        total_charged: totalCharged,
        payout_amount: payoutAmount,
        platform_fee: platformFee,
        matched_count: matched.length
      });
    }

    // ══════════════════════════════════════════════════════════
    // MATCH — جلب المساحين المتطابقين لطلب (للعميل)
    // ══════════════════════════════════════════════════════════
    if (action === 'match') {
      const { request_id } = body;
      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.client_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'غير مصرح لك بالاطلاع على هذا الطلب' }, { status: 403 });
      }

      const allSurveyors = await base44.asServiceRole.entities.SurveyorProfile.filter({
        status: 'approved',
        is_available: true
      });

      const matched = [];
      for (const s of allSurveyors) {
        if (s.latitude == null || s.longitude == null) continue;
        const dist = haversineKm(request.latitude, request.longitude, s.latitude, s.longitude);
        const radius = s.geofencing_radius_km || 50;
        if (dist <= radius) {
          matched.push({
            surveyor_id: s.id,
            name: s.full_name,
            email: s.email,
            distance_km: Math.round(dist * 100) / 100,
            rating: s.rating || 0,
            total_jobs: s.total_jobs || 0,
            license_number: s.license_number
          });
        }
      }

      matched.sort((a, b) => a.distance_km - b.distance_km);

      return Response.json({ request_id, matched_surveyors: matched });
    }

    // ══════════════════════════════════════════════════════════
    // ACCEPT — مساح يقبل طلب (First-Come, First-Served)
    // ══════════════════════════════════════════════════════════
    if (action === 'accept') {
      const { request_id } = body;

      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.status !== 'broadcasted' && request.status !== 'pending') {
        return Response.json({ error: 'تم قبول الطلب بالفعل من مساح آخر' }, { status: 400 });
      }

      const [surveyor] = await base44.entities.SurveyorProfile.filter({ email: user.email });
      if (!surveyor || surveyor.status !== 'approved') {
        return Response.json({ error: 'يجب أن تكون مساحاً معتمداً لقبول الطلبات' }, { status: 403 });
      }

      // First-come-first-served: update status atomically
      await base44.asServiceRole.entities.SurveyRequest.update(request_id, {
        status: 'accepted',
        surveyor_id: surveyor.id,
        surveyor_name: surveyor.full_name,
        surveyor_email: surveyor.email,
        accepted_at: new Date().toISOString()
      });

      // Notify client
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: request.client_email,
        title: '✅ تم تعيين مساح لطلبك!',
        message: `قبل المساح ${surveyor.full_name} طلب المسح الخاص بك. سيتواصل معك قريباً لترتيب موعد المعاينة.`,
        type: 'system',
        priority: 'high'
      });

      return Response.json({ success: true, request_id, surveyor_name: surveyor.full_name });
    }

    // ══════════════════════════════════════════════════════════
    // SUBMIT — المساح يسلم المخرجات
    // ══════════════════════════════════════════════════════════
    if (action === 'submit') {
      const { request_id, cad_files, visual_files, survey_metadata } = body;

      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.surveyor_email !== user.email) {
        return Response.json({ error: 'غير مصرح لك بتسليم هذا الطلب' }, { status: 403 });
      }
      if (request.status !== 'accepted' && request.status !== 'in_progress') {
        return Response.json({ error: 'حالة الطلب لا تسمح بالتسليم' }, { status: 400 });
      }

      const [surveyor] = await base44.entities.SurveyorProfile.filter({ email: user.email });

      // Create deliverable record
      await base44.entities.SurveyDeliverable.create({
        request_id,
        surveyor_id: surveyor.id,
        cad_files: cad_files || [],
        visual_files: visual_files || [],
        survey_metadata: survey_metadata || {},
        submitted_at: new Date().toISOString()
      });

      // Update request status
      await base44.asServiceRole.entities.SurveyRequest.update(request_id, {
        status: 'submitted',
        submitted_at: new Date().toISOString()
      });

      // Notify client
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: request.client_email,
        title: '📐 تم تسليم مخرجات المسح!',
        message: `قام المساح ${surveyor.full_name} بتسليم ملفات الرفع المساحي. يرجى مراجعة المخرجات واعتمادها.`,
        type: 'review',
        priority: 'urgent'
      });

      return Response.json({ success: true, request_id });
    }

    // ══════════════════════════════════════════════════════════
    // APPROVE — العميل يعتمد المخرجات ويتم صرف المبلغ
    // ══════════════════════════════════════════════════════════
    if (action === 'approve') {
      const { request_id } = body;

      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.client_email !== user.email) {
        return Response.json({ error: 'غير مصرح لك باعتماد هذا الطلب' }, { status: 403 });
      }
      if (request.status !== 'submitted') {
        return Response.json({ error: 'يجب تسليم المخرجات أولاً' }, { status: 400 });
      }

      const payoutAmount = request.payout_amount || 0;
      const platformFee = request.platform_fee || 0;

      // Credit surveyor
      if (request.surveyor_id) {
        const [surveyor] = await base44.asServiceRole.entities.SurveyorProfile.filter({ id: request.surveyor_id });
        if (surveyor) {
          await base44.asServiceRole.entities.SurveyorProfile.update(surveyor.id, {
            available_balance: (surveyor.available_balance || 0) + payoutAmount,
            total_jobs: (surveyor.total_jobs || 0) + 1
          });
        }
      }

      // Update request
      await base44.asServiceRole.entities.SurveyRequest.update(request_id, {
        status: 'disbursed',
        escrow_status: 'released',
        approved_at: new Date().toISOString(),
        disbursed_at: new Date().toISOString()
      });

      // Transactions
      await Promise.all([
        base44.asServiceRole.entities.Transaction.create({
          user_email: request.surveyor_email,
          user_type: 'engineer',
          type: 'escrow_release',
          amount: payoutAmount + platformFee,
          commission_amount: platformFee,
          net_amount: payoutAmount,
          status: 'completed',
          description: `صرف مستحقات مسح — ${request.address || 'موقع العقار'}`,
          reference_id: request_id
        }),
        base44.asServiceRole.entities.Transaction.create({
          user_email: 'platform',
          user_type: 'platform',
          type: 'commission',
          amount: platformFee,
          status: 'completed',
          description: `عمولة منصة — طلب مسح ${request_id}`,
          reference_id: request_id
        })
      ]);

      // Notify surveyor
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: request.surveyor_email,
        title: '💰 تم صرف مستحقاتك!',
        message: `اعتمد العميل مخرجات المسح. تم إضافة ${payoutAmount} ريال لرصيدك المتاح.`,
        type: 'payment',
        priority: 'urgent'
      });

      return Response.json({ success: true, request_id, payout_amount: payoutAmount });
    }

    // ══════════════════════════════════════════════════════════
    // LIST — جلب الطلبات حسب دور المستخدم
    // ══════════════════════════════════════════════════════════
    if (action === 'list') {
      const { role_type } = body; // 'client' or 'surveyor'

      let requests;
      if (role_type === 'client') {
        requests = await base44.entities.SurveyRequest.filter(
          { client_email: user.email },
          '-created_date',
          50
        );
      } else if (role_type === 'surveyor') {
        requests = await base44.entities.SurveyRequest.filter(
          { surveyor_email: user.email },
          '-created_date',
          50
        );
      } else if (role_type === 'available') {
        // Surveyor looking for available gigs
        const [surveyor] = await base44.entities.SurveyorProfile.filter({ email: user.email });
        if (!surveyor) return Response.json({ error: 'لم يتم العثور على ملف المساح' }, { status: 404 });

        const all = await base44.entities.SurveyRequest.filter(
          { status: 'broadcasted' },
          '-created_date',
          50
        );

        // Filter by geofencing
        requests = all.filter(r => {
          if (r.latitude == null || r.longitude == null) return false;
          const dist = haversineKm(surveyor.latitude, surveyor.longitude, r.latitude, r.longitude);
          return dist <= (surveyor.geofencing_radius_km || 50);
        });
      } else {
        return Response.json({ error: 'نوع الدور مطلوب (client, surveyor, available)' }, { status: 400 });
      }

      // Enrich with deliverables
      const enriched = await Promise.all(requests.map(async (r) => {
        const deliverables = await base44.entities.SurveyDeliverable.filter({ request_id: r.id }, '-created_date', 5);
        return { ...r, deliverables };
      }));

      return Response.json({ requests: enriched });
    }

    // ══════════════════════════════════════════════════════════
    // STATUS — جلب تفاصيل طلب معين
    // ══════════════════════════════════════════════════════════
    if (action === 'status') {
      const { request_id } = body;
      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.client_email !== user.email && request.surveyor_email !== user.email && user.role !== 'admin') {
        return Response.json({ error: 'غير مصرح لك بالاطلاع على هذا الطلب' }, { status: 403 });
      }

      const deliverables = await base44.entities.SurveyDeliverable.filter({ request_id }, '-created_date', 5);

      let surveyor = null;
      if (request.surveyor_id) {
        const [sv] = await base44.asServiceRole.entities.SurveyorProfile.filter({ id: request.surveyor_id });
        surveyor = sv || null;
      }

      return Response.json({ request, deliverables, surveyor });
    }

    // ══════════════════════════════════════════════════════════
    // CANCEL — العميل يلغي الطلب (فقط قبل القبول)
    // ══════════════════════════════════════════════════════════
    if (action === 'cancel') {
      const { request_id } = body;

      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.client_email !== user.email) {
        return Response.json({ error: 'غير مصرح لك بإلغاء هذا الطلب' }, { status: 403 });
      }
      if (request.status === 'accepted' || request.status === 'in_progress') {
        return Response.json({ error: 'لا يمكن إلغاء الطلب بعد قبوله من المساح' }, { status: 400 });
      }

      const totalCharged = request.total_charged || 0;

      // Refund to client wallet
      const [client] = await base44.entities.Client.filter({ email: user.email });
      if (client && totalCharged > 0) {
        await base44.asServiceRole.entities.Client.update(client.id, {
          wallet_balance: (client.wallet_balance || 0) + totalCharged
        });
      }

      await base44.asServiceRole.entities.SurveyRequest.update(request_id, {
        status: 'cancelled',
        escrow_status: 'refunded'
      });

      await base44.asServiceRole.entities.Transaction.create({
        user_email: user.email,
        user_type: 'client',
        type: 'refund',
        amount: totalCharged,
        status: 'completed',
        description: `استرجاع مبلغ طلب مسح ملغي`,
        reference_id: request_id
      });

      return Response.json({ success: true, refunded_amount: totalCharged });
    }

    // ══════════════════════════════════════════════════════════
    // REVIEW — العميل يقيم المساح بعد اكتمال الطلب
    // ══════════════════════════════════════════════════════════
    if (action === 'review') {
      const { request_id, surveyor_id, client_id, rating, quality_rating, delivery_rating, communication_rating, comment } = body;

      if (!rating || rating < 1 || rating > 5) {
        return Response.json({ error: 'التقييم العام مطلوب (من 1 إلى 5)' }, { status: 400 });
      }

      const [request] = await base44.entities.SurveyRequest.filter({ id: request_id });
      if (!request) return Response.json({ error: 'الطلب غير موجود' }, { status: 404 });
      if (request.client_email !== user.email) {
        return Response.json({ error: 'غير مصرح لك بتقييم هذا الطلب' }, { status: 403 });
      }

      // Check if already reviewed
      const existing = await base44.entities.Review.filter({
        engineer_id: surveyor_id,
        client_id,
        project_id: request_id
      });
      if (existing.length > 0) {
        return Response.json({ error: 'قمت بتقييم هذا المساح مسبقاً' }, { status: 400 });
      }

      // Create review
      await base44.entities.Review.create({
        engineer_id: surveyor_id,
        client_id,
        project_id: request_id,
        milestone_title: `رفع مساحي - ${request.address || 'موقع العقار'}`,
        rating,
        quality_rating: quality_rating || 0,
        communication_rating: communication_rating || 0,
        delivery_rating: delivery_rating || 0,
        comment: comment || '',
        status: 'completed'
      });

      // Update surveyor rating
      const allReviews = await base44.asServiceRole.entities.Review.filter({ engineer_id: surveyor_id });
      if (allReviews.length > 0) {
        const avgRating = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / allReviews.length;
        await base44.asServiceRole.entities.SurveyorProfile.update(surveyor_id, {
          rating: Math.round(avgRating * 10) / 10,
          total_jobs: (request.total_jobs || 0) // already incremented in approve
        });
      }

      // Notify surveyor
      await base44.asServiceRole.entities.Notification.create({
        recipient_email: request.surveyor_email,
        title: '⭐ تقييم جديد!',
        message: `قام العميل بتقييم أدائك بـ ${rating} نجوم في طلب المسح.`,
        type: 'review',
        priority: 'medium'
      });

      return Response.json({ success: true });
    }

    // ══════════════════════════════════════════════════════════
    // REGISTER — تسجيل مساح جديد
    // ══════════════════════════════════════════════════════════
    if (action === 'register') {
      const { license_number, city, latitude, longitude, geofencing_radius_km, bio, years_experience } = body;

      const existing = await base44.entities.SurveyorProfile.filter({ email: user.email });
      if (existing.length > 0) {
        return Response.json({ error: 'لديك ملف مساح بالفعل' }, { status: 400 });
      }

      const profile = await base44.entities.SurveyorProfile.create({
        full_name: user.full_name || body.full_name,
        email: user.email,
        phone: body.phone || '',
        license_number,
        city,
        latitude: latitude || null,
        longitude: longitude || null,
        geofencing_radius_km: geofencing_radius_km || 50,
        bio: bio || '',
        years_experience: years_experience || 0,
        status: 'pending'
      });

      return Response.json({ success: true, profile_id: profile.id });
    }

    return Response.json({ error: 'إجراء غير صالح' }, { status: 400 });

  } catch (error) {
    console.error('SurveyEngine error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});