export const REAL_WORKFLOW_CATALOG = [
  {
    "id": "source:Auto Generate Contract on Proposal Acceptance.jsonc",
    "name": "Auto Generate Contract on Proposal Acceptance",
    "description": "عند قبول عرض مهندس، يتم توليد عقد عمل رقمي تلقائياً بين المهندس والعميل وحفظ نسخة في سجل المشروع",
    "sourceFile": "base44/workflows/Auto Generate Contract on Proposal Acceptance.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "autoGenerateContract"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "create_contract",
        "config": {
          "source_function": "autoGenerateContract"
        }
      }
    ]
  },
  {
    "id": "source:BIM Model Auto-Archive & Notify.jsonc",
    "name": "BIM Model Auto-Archive & Notify",
    "description": "عند رفع نموذج BIM جديد: ينشئ مجلد في Drive، يرسل إشعار للمهندس عبر Gmail، ويحدث جدول البيانات",
    "sourceFile": "base44/workflows/BIM Model Auto-Archive & Notify.jsonc",
    "sourceEntity": "BIMModel",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "bimAutomate"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "bimAutomate"
        }
      }
    ]
  },
  {
    "id": "source:Contract Signed Handler.jsonc",
    "name": "Contract Signed Handler",
    "description": "عند تحديث العقد (توقيع أحد الطرفين)، يتم تشغيل منطق الإشعارات وحفظ نسخة احتياطية في Google Drive عند اكتمال التوقيع",
    "sourceFile": "base44/workflows/Contract Signed Handler.jsonc",
    "sourceEntity": "Contract",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "handleContractSigned"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "create_contract",
        "config": {
          "source_function": "handleContractSigned"
        }
      }
    ]
  },
  {
    "id": "source:Daily GA Active Users Sync.jsonc",
    "name": "Daily GA Active Users Sync",
    "description": "يجلب بيانات المستخدمين النشطين اليومية من Google Analytics 4 ويخزنها في كيان AnalyticsDailyActiveUser",
    "sourceFile": "base44/workflows/Daily GA Active Users Sync.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "fetchDailyActiveUsers"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 2 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "webhook",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "fetchDailyActiveUsers"
        }
      }
    ]
  },
  {
    "id": "source:Daily Payment Reminders.jsonc",
    "name": "Daily Payment Reminders",
    "description": "يفحص الفواتير غير المدفوعة يومياً ويرسل تنبيهات للعميل عند اقتراب موعد السداد (7 أيام، 3 أيام، يوم واحد، ومتأخر)",
    "sourceFile": "base44/workflows/Daily Payment Reminders.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "processPaymentReminders"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 6 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "processPaymentReminders"
        }
      }
    ]
  },
  {
    "id": "source:Notify New Messages.jsonc",
    "name": "Notify New Messages",
    "description": "Send notifications when new messages are created in project chats",
    "sourceFile": "base44/workflows/Notify New Messages.jsonc",
    "sourceEntity": "Message",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewMessage"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyNewMessage"
        }
      }
    ]
  },
  {
    "id": "source:Supabase Project Status Sync.jsonc",
    "name": "Supabase Project Status Sync",
    "description": "Bidirectionally syncs project status between Base44 and Supabase whenever a project changes — pushes the changed project to Supabase and pulls externally-edited rows back to Base44 so all engineering teams stay in sync.",
    "sourceFile": "base44/workflows/Supabase Project Status Sync.jsonc",
    "sourceEntity": "Project",
    "sourceEvents": [
      "create",
      "update",
      "delete"
    ],
    "sourceFunctions": [
      "supabaseProjectSync"
    ],
    "trigger_type": "event",
    "trigger_event": "project_created",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "supabaseProjectSync"
        }
      }
    ]
  },
  {
    "id": "source:إرسال التنبيهات المجدولة.jsonc",
    "name": "إرسال التنبيهات المجدولة",
    "description": "",
    "sourceFile": "base44/workflows/إرسال التنبيهات المجدولة.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "sendScheduledAlerts"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "sendScheduledAlerts"
        }
      }
    ]
  },
  {
    "id": "source:إرسال تحديثات المراحل للعملاء.jsonc",
    "name": "إرسال تحديثات المراحل للعملاء",
    "description": "",
    "sourceFile": "base44/workflows/إرسال تحديثات المراحل للعملاء.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "emailService"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "emailService"
        }
      }
    ]
  },
  {
    "id": "source:إرسال تذكيرات الدفع يومياً.jsonc",
    "name": "إرسال تذكيرات الدفع يومياً",
    "description": "",
    "sourceFile": "base44/workflows/إرسال تذكيرات الدفع يومياً.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "processPaymentReminders"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 6 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "processPaymentReminders"
        }
      }
    ]
  },
  {
    "id": "source:إرسال تذكيرات المواعيد.jsonc",
    "name": "إرسال تذكيرات المواعيد",
    "description": "إرسال تذكيرات تلقائية قبل المواعيد بـ 24 ساعة و 1 ساعة",
    "sourceFile": "base44/workflows/إرسال تذكيرات المواعيد.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "sendAppointmentReminders"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": "UTC",
    "integration_trigger": "email",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "sendAppointmentReminders"
        }
      }
    ]
  },
  {
    "id": "source:إرسال تنبيه عند تقديم عرض جديد.jsonc",
    "name": "إرسال تنبيه عند تقديم عرض جديد",
    "description": "إرسال تنبيهات تلقائية للعميل عند تقديم مهندس عرضاً جديداً على مشروعه",
    "sourceFile": "base44/workflows/إرسال تنبيه عند تقديم عرض جديد.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewProposal"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyNewProposal"
        }
      }
    ]
  },
  {
    "id": "source:إرسال رسائل متابعة الموافقات المعلقة.jsonc",
    "name": "إرسال رسائل متابعة الموافقات المعلقة",
    "description": "إرسال رسائل تذكير تلقائية للموافقات المعلقة منذ يومين أو أكثر",
    "sourceFile": "base44/workflows/إرسال رسائل متابعة الموافقات المعلقة.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "sendFollowupMessages"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 6 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "sendFollowupMessages"
        }
      }
    ]
  },
  {
    "id": "source:إشعار اعتماد المرحلة.jsonc",
    "name": "إشعار اعتماد المرحلة",
    "description": "إرسال إشعار للمهندس عند اعتماد مرحلة من مشروعه",
    "sourceFile": "base44/workflows/إشعار اعتماد المرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "notifyMilestoneApproval"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyMilestoneApproval"
        }
      }
    ]
  },
  {
    "id": "source:إشعار المهندسين بمشاريع جديدة.jsonc",
    "name": "إشعار المهندسين بمشاريع جديدة",
    "description": "",
    "sourceFile": "base44/workflows/إشعار المهندسين بمشاريع جديدة.jsonc",
    "sourceEntity": "Project",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "emailService"
    ],
    "trigger_type": "event",
    "trigger_event": "project_created",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "emailService"
        }
      }
    ]
  },
  {
    "id": "source:إشعار باستفسار شات بوت جديد.jsonc",
    "name": "إشعار باستفسار شات بوت جديد",
    "description": "يرسل بريداً إلكترونياً للمسؤول عند استفسار جديد عبر الشات بوت",
    "sourceFile": "base44/workflows/إشعار باستفسار شات بوت جديد.jsonc",
    "sourceEntity": "ChatbotConversation",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewChatbotMessage"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyNewChatbotMessage"
        }
      }
    ]
  },
  {
    "id": "source:إشعار بتسجيل مهندس جديد.jsonc",
    "name": "إشعار بتسجيل مهندس جديد",
    "description": "يرسل بريداً إلكترونياً للمسؤول عند تسجيل مهندس جديد",
    "sourceFile": "base44/workflows/إشعار بتسجيل مهندس جديد.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewEngineer"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyNewEngineer"
        }
      }
    ]
  },
  {
    "id": "source:إشعار برفع شهادة جودة.jsonc",
    "name": "إشعار برفع شهادة جودة",
    "description": "يرسل بريداً إلكترونياً للمسؤول عند رفع شهادة جودة من مستشار فني",
    "sourceFile": "base44/workflows/إشعار برفع شهادة جودة.jsonc",
    "sourceEntity": "TechnicalReview",
    "sourceEvents": [
      "create",
      "update"
    ],
    "sourceFunctions": [
      "notifyCertificateUpload"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyCertificateUpload"
        }
      }
    ]
  },
  {
    "id": "source:إشعار بريد عند تسجيل شركة استشارية جديدة.jsonc",
    "name": "إشعار بريد عند تسجيل شركة استشارية جديدة",
    "description": "يرسل بريد إلى info@mybytly.com عبر Gmail عند تسجيل شركة استشارية جديدة",
    "sourceFile": "base44/workflows/إشعار بريد عند تسجيل شركة استشارية جديدة.jsonc",
    "sourceEntity": "EngineeringFirm",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewUserSignup"
    ],
    "trigger_type": "event",
    "trigger_event": "firm_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyNewUserSignup"
        }
      }
    ]
  },
  {
    "id": "source:إشعار بريد عند تسجيل عميل جديد.jsonc",
    "name": "إشعار بريد عند تسجيل عميل جديد",
    "description": "يرسل بريد إلى info@mybytly.com عبر Gmail عند تسجيل عميل جديد",
    "sourceFile": "base44/workflows/إشعار بريد عند تسجيل عميل جديد.jsonc",
    "sourceEntity": "Client",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewUserSignup"
    ],
    "trigger_type": "event",
    "trigger_event": "client_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyNewUserSignup"
        }
      }
    ]
  },
  {
    "id": "source:إشعار بريد عند تسجيل مهندس جديد.jsonc",
    "name": "إشعار بريد عند تسجيل مهندس جديد",
    "description": "يرسل بريد إلى info@mybytly.com عبر Gmail عند تسجيل مهندس جديد",
    "sourceFile": "base44/workflows/إشعار بريد عند تسجيل مهندس جديد.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewUserSignup"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyNewUserSignup"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تحديث العقد.jsonc",
    "name": "إشعار تحديث العقد",
    "description": "",
    "sourceFile": "base44/workflows/إشعار تحديث العقد.jsonc",
    "sourceEntity": "Contract",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تحديث النزاع.jsonc",
    "name": "إشعار تحديث النزاع",
    "description": "يرسل إشعارات للأطراف المعنية عند تغيير حالة النزاع أو إضافة رسالة جديدة",
    "sourceFile": "base44/workflows/إشعار تحديث النزاع.jsonc",
    "sourceEntity": "Dispute",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "notifyDisputeUpdate"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "disputes",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyDisputeUpdate"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تحديث مراحل البناء.jsonc",
    "name": "إشعار تحديث مراحل البناء",
    "description": "",
    "sourceFile": "base44/workflows/إشعار تحديث مراحل البناء.jsonc",
    "sourceEntity": "BuildingProgress",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "notifyBuildingProgress"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyBuildingProgress"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تسجيل شركة جديدة.jsonc",
    "name": "إشعار تسجيل شركة جديدة",
    "description": "إشعار عند تسجيل شركة جديدة",
    "sourceFile": "base44/workflows/إشعار تسجيل شركة جديدة.jsonc",
    "sourceEntity": "EngineeringFirm",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "firm_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تسجيل عميل جديد.jsonc",
    "name": "إشعار تسجيل عميل جديد",
    "description": "إشعار عند تسجيل عميل جديد",
    "sourceFile": "base44/workflows/إشعار تسجيل عميل جديد.jsonc",
    "sourceEntity": "Client",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "client_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تسجيل مهندس جديد.jsonc",
    "name": "إشعار تسجيل مهندس جديد",
    "description": "إشعار عند تسجيل مهندس جديد",
    "sourceFile": "base44/workflows/إشعار تسجيل مهندس جديد.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعار تغيير حالة المشروع.jsonc",
    "name": "إشعار تغيير حالة المشروع",
    "description": "",
    "sourceFile": "base44/workflows/إشعار تغيير حالة المشروع.jsonc",
    "sourceEntity": "Project",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "project_status_changed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعار عرض جديد.jsonc",
    "name": "إشعار عرض جديد",
    "description": "إرسال إشعار للعميل عند تقديم عرض جديد على مشروعه",
    "sourceFile": "base44/workflows/إشعار عرض جديد.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "notifyNewProposal"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyNewProposal"
        }
      }
    ]
  },
  {
    "id": "source:إشعار عرض سعر جديد.jsonc",
    "name": "إشعار عرض سعر جديد",
    "description": "",
    "sourceFile": "base44/workflows/إشعار عرض سعر جديد.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعارات العروض الجديدة.jsonc",
    "name": "إشعارات العروض الجديدة",
    "description": "إرسال إشعار فوري للعميل عند تلقي عرض سعر جديد من مهندس",
    "sourceFile": "base44/workflows/إشعارات العروض الجديدة.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعارات تحديث العقود.jsonc",
    "name": "إشعارات تحديث العقود",
    "description": "إرسال إشعارات عند تحديث حالة العقد (توقيع، تفعيل، إلخ)",
    "sourceFile": "base44/workflows/إشعارات تحديث العقود.jsonc",
    "sourceEntity": "Contract",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إشعارات تحديث حالة المشروع.jsonc",
    "name": "إشعارات تحديث حالة المشروع",
    "description": "إرسال إشعارات تلقائية عند تغيير حالة المشروع أو إضافة عرض جديد",
    "sourceFile": "base44/workflows/إشعارات تحديث حالة المشروع.jsonc",
    "sourceEntity": "Project",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "projectNotifications"
    ],
    "trigger_type": "event",
    "trigger_event": "project_status_changed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "projectNotifications"
        }
      }
    ]
  },
  {
    "id": "source:إصدار فاتورة تلقائية عند اعتماد المرحلة.jsonc",
    "name": "إصدار فاتورة تلقائية عند اعتماد المرحلة",
    "description": "يُصدر فاتورة إلكترونية تلقائياً عند موافقة العميل على مرحلة المشروع",
    "sourceFile": "base44/workflows/إصدار فاتورة تلقائية عند اعتماد المرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "autoInvoiceOnMilestoneApproval"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "generate_invoice",
        "config": {
          "source_function": "autoInvoiceOnMilestoneApproval"
        }
      }
    ]
  },
  {
    "id": "source:إضافة مواعيد السحب لتقويم جوجل.jsonc",
    "name": "إضافة مواعيد السحب لتقويم جوجل",
    "description": "عند إنشاء طلب سحب جديد للمقاول أو المورد، يُضاف موعد المعالجة تلقائياً إلى تقويم جوجل",
    "sourceFile": "base44/workflows/إضافة مواعيد السحب لتقويم جوجل.jsonc",
    "sourceEntity": "WithdrawalRequest",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "addFinancialDueDateToCalendar"
    ],
    "trigger_type": "event",
    "trigger_event": "withdrawal_requested",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "addFinancialDueDateToCalendar"
        }
      }
    ]
  },
  {
    "id": "source:إضافة مواعيد الفواتير لتقويم جوجل.jsonc",
    "name": "إضافة مواعيد الفواتير لتقويم جوجل",
    "description": "عند إنشاء فاتورة جديدة، يُضاف موعد الاستحقاق تلقائياً إلى تقويم جوجل",
    "sourceFile": "base44/workflows/إضافة مواعيد الفواتير لتقويم جوجل.jsonc",
    "sourceEntity": "Invoice",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "addFinancialDueDateToCalendar"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "addFinancialDueDateToCalendar"
        }
      }
    ]
  },
  {
    "id": "source:إضافة موعد المرحلة إلى تقويم جوجل.jsonc",
    "name": "إضافة موعد المرحلة إلى تقويم جوجل",
    "description": "يضيف أو يحدّث موعد تسليم المرحلة في تقويم جوجل للمهندس والعميل كلما تم تحديد أو تغيير تاريخ الاستحقاق",
    "sourceFile": "base44/workflows/إضافة موعد المرحلة إلى تقويم جوجل.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "create",
      "update"
    ],
    "sourceFunctions": [
      "addMilestoneToCalendar"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "addMilestoneToCalendar"
        }
      }
    ]
  },
  {
    "id": "source:إنشاء تنبيهات ذكية يومية.jsonc",
    "name": "إنشاء تنبيهات ذكية يومية",
    "description": "",
    "sourceFile": "base44/workflows/إنشاء تنبيهات ذكية يومية.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "createSmartAlerts"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 5 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "createSmartAlerts"
        }
      }
    ]
  },
  {
    "id": "source:التحقق من المشاريع المتأخرة.jsonc",
    "name": "التحقق من المشاريع المتأخرة",
    "description": "يتحقق يومياً من المشاريع المتأخرة ويرسل إشعارات للمهندسين والعملاء",
    "sourceFile": "base44/workflows/التحقق من المشاريع المتأخرة.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "checkOverdueProjects"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 6 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "checkOverdueProjects"
        }
      }
    ]
  },
  {
    "id": "source:الملخص الأسبوعي للمشاريع.jsonc",
    "name": "الملخص الأسبوعي للمشاريع",
    "description": "يرسل ملخصًا أسبوعيًا لحالة المشاريع وإحصائياتها وحركة العمل إلى بريد جميع الأدمن كل يوم اثنين الساعة 9 صباحًا",
    "sourceFile": "base44/workflows/الملخص الأسبوعي للمشاريع.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "weeklyProjectSummaryEmail"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 9 * * 1",
    "schedule_timezone": "Asia/Riyadh",
    "integration_trigger": "email",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "weeklyProjectSummaryEmail"
        }
      }
    ]
  },
  {
    "id": "source:تحديث المشروع عند توقيع العقد.jsonc",
    "name": "تحديث المشروع عند توقيع العقد",
    "description": "",
    "sourceFile": "base44/workflows/تحديث المشروع عند توقيع العقد.jsonc",
    "sourceEntity": "Contract",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "handleContractSigned"
    ],
    "trigger_type": "event",
    "trigger_event": "contract_signed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "create_contract",
        "config": {
          "source_function": "handleContractSigned"
        }
      }
    ]
  },
  {
    "id": "source:تحديث تقييم المهندس.jsonc",
    "name": "تحديث تقييم المهندس",
    "description": "يحدث متوسط تقييم المهندس تلقائياً عند إضافة أو تعديل أو حذف تقييم",
    "sourceFile": "base44/workflows/تحديث تقييم المهندس.jsonc",
    "sourceEntity": "Review",
    "sourceEvents": [
      "create",
      "update",
      "delete"
    ],
    "sourceFunctions": [
      "updateEngineerRating"
    ],
    "trigger_type": "event",
    "trigger_event": "review_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "updateEngineerRating"
        }
      }
    ]
  },
  {
    "id": "source:تحليل المخاطر الأسبوعي وتنبيه المهندسين.jsonc",
    "name": "تحليل المخاطر الأسبوعي وتنبيه المهندسين",
    "description": "يشغل وظيفة تحليل المخاطر أسبوعياً لكل مشروع نشط، يكشف المراحل المتأخرة عن موعد تسليمها والمخاطر العالية، ويرسل تنبيهاً عاجلاً للمهندس والعميل مع إنشاء ملاحظة استشارية عبر bytly_advisor",
    "sourceFile": "base44/workflows/تحليل المخاطر الأسبوعي وتنبيه المهندسين.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "weeklyRiskAlertProcessor"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 8 * * 1",
    "schedule_timezone": "Asia/Riyadh",
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "weeklyRiskAlertProcessor"
        }
      }
    ]
  },
  {
    "id": "source:تحليل مخاطر المشاريع اليومي.jsonc",
    "name": "تحليل مخاطر المشاريع اليومي",
    "description": "تحليل ذكي يومي لمخاطر المشاريع النشطة",
    "sourceFile": "base44/workflows/تحليل مخاطر المشاريع اليومي.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "analyzeProjectRisks"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 5 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "analyzeProjectRisks"
        }
      }
    ]
  },
  {
    "id": "source:تسجيل عميل جديد في Google Sheets.jsonc",
    "name": "تسجيل عميل جديد في Google Sheets",
    "description": "",
    "sourceFile": "base44/workflows/تسجيل عميل جديد في Google Sheets.jsonc",
    "sourceEntity": "Client",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "syncUserToSheets"
    ],
    "trigger_type": "event",
    "trigger_event": "client_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "syncUserToSheets"
        }
      }
    ]
  },
  {
    "id": "source:تسجيل مهندس جديد في Google Sheets.jsonc",
    "name": "تسجيل مهندس جديد في Google Sheets",
    "description": "",
    "sourceFile": "base44/workflows/تسجيل مهندس جديد في Google Sheets.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "syncUserToSheets"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "syncUserToSheets"
        }
      }
    ]
  },
  {
    "id": "source:تسجيل نشاط المهام تلقائياً.jsonc",
    "name": "تسجيل نشاط المهام تلقائياً",
    "description": "يسجّل كل تعديل على مهام المشروع في سجل النشاط التاريخي للشفافية بين المهندس والعميل",
    "sourceFile": "base44/workflows/تسجيل نشاط المهام تلقائياً.jsonc",
    "sourceEntity": "ProjectTask",
    "sourceEvents": [
      "create",
      "update",
      "delete"
    ],
    "sourceFunctions": [
      "logTaskActivity"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "logTaskActivity"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه تحرير الدفعة المالية.jsonc",
    "name": "تنبيه تحرير الدفعة المالية",
    "description": "يرسل إشعار متعدد القنوات للمهندس عند تحرير دفعة مالية لمرحلة مكتملة",
    "sourceFile": "base44/workflows/تنبيه تحرير الدفعة المالية.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "eventDrivenNotifier"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "eventDrivenNotifier"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه تسليم مرحلة — مراجعة العميل.jsonc",
    "name": "تنبيه تسليم مرحلة — مراجعة العميل",
    "description": "يُشعر العميل عبر 3 قنوات عند تسليم المهندس لمرحلة وتطلب موافقته",
    "sourceFile": "base44/workflows/تنبيه تسليم مرحلة — مراجعة العميل.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "eventDrivenNotifier"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "eventDrivenNotifier"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه رفع شهادة تخرج مهندس.jsonc",
    "name": "تنبيه رفع شهادة تخرج مهندس",
    "description": "يرسل إشعاراً فورياً للوحة تحكم الإدارة عند قيام المهندس برفع شهادة تخرج جديدة",
    "sourceFile": "base44/workflows/تنبيه رفع شهادة تخرج مهندس.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "notifyEngineerCertificateUpload"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "notifyEngineerCertificateUpload"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه قبول العرض.jsonc",
    "name": "تنبيه قبول العرض",
    "description": "يرسل إشعار داخل التطبيق + بريد إلكتروني + واتساب للمهندس والعميل عند قبول عرض",
    "sourceFile": "base44/workflows/تنبيه قبول العرض.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "eventDrivenNotifier"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_accepted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "eventDrivenNotifier"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه موافقة العميل على مرحلة.jsonc",
    "name": "تنبيه موافقة العميل على مرحلة",
    "description": "يُشعر المهندس عند موافقة العميل على مرحلة ويذكره بالدفعة المستحقة",
    "sourceFile": "base44/workflows/تنبيه موافقة العميل على مرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "eventDrivenNotifier"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "eventDrivenNotifier"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه موعد تسليم المشروع - 24 ساعة.jsonc",
    "name": "تنبيه موعد تسليم المشروع - 24 ساعة",
    "description": "",
    "sourceFile": "base44/workflows/تنبيه موعد تسليم المشروع - 24 ساعة.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "checkProjectDeadlines"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "checkProjectDeadlines"
        }
      }
    ]
  },
  {
    "id": "source:تنبيه واتساب - رسائل غير مقروءة.jsonc",
    "name": "تنبيه واتساب - رسائل غير مقروءة",
    "description": "",
    "sourceFile": "base44/workflows/تنبيه واتساب - رسائل غير مقروءة.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "checkUnreadMessages"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "checkUnreadMessages"
        }
      }
    ]
  },
  {
    "id": "source:توليد الفواتير تلقائياً عند تفعيل العقد.jsonc",
    "name": "توليد الفواتير تلقائياً عند تفعيل العقد",
    "description": "",
    "sourceFile": "base44/workflows/توليد الفواتير تلقائياً عند تفعيل العقد.jsonc",
    "sourceEntity": "Contract",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "generateInvoices"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "generate_invoice",
        "config": {
          "source_function": "generateInvoices"
        }
      }
    ]
  },
  {
    "id": "source:توليد عقد تلقائي عند قبول العرض.jsonc",
    "name": "توليد عقد تلقائي عند قبول العرض",
    "description": "",
    "sourceFile": "base44/workflows/توليد عقد تلقائي عند قبول العرض.jsonc",
    "sourceEntity": "Proposal",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "autoGenerateContract"
    ],
    "trigger_type": "event",
    "trigger_event": "proposal_accepted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "contracts",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "create_contract",
        "config": {
          "source_function": "autoGenerateContract"
        }
      }
    ]
  },
  {
    "id": "source:رسالة ترحيب المهندس المعتمد.jsonc",
    "name": "رسالة ترحيب المهندس المعتمد",
    "description": "يرسل رسالة ترحيب للمهندس تلقائياً عند اعتماد حسابه (تغيير الحالة من pending إلى approved)",
    "sourceFile": "base44/workflows/رسالة ترحيب المهندس المعتمد.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "notifyEngineerApproval"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_approved",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "email",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_email",
        "config": {
          "source_function": "notifyEngineerApproval"
        }
      }
    ]
  },
  {
    "id": "source:رفع تصاميم المشروع إلى Google Drive.jsonc",
    "name": "رفع تصاميم المشروع إلى Google Drive",
    "description": "",
    "sourceFile": "base44/workflows/رفع تصاميم المشروع إلى Google Drive.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "uploadDesignToDrive"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "uploadDesignToDrive"
        }
      }
    ]
  },
  {
    "id": "source:طلب تقييم عند إكمال المشروع.jsonc",
    "name": "طلب تقييم عند إكمال المشروع",
    "description": "يطلب تقييماً من العميل تلقائياً عند تغيير حالة المشروع إلى مكتمل",
    "sourceFile": "base44/workflows/طلب تقييم عند إكمال المشروع.jsonc",
    "sourceEntity": "Project",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "requestReview"
    ],
    "trigger_type": "event",
    "trigger_event": "project_status_changed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "requestReview"
        }
      }
    ]
  },
  {
    "id": "source:طلب تقييم عند اكتمال مرحلة.jsonc",
    "name": "طلب تقييم عند اكتمال مرحلة",
    "description": "يطلق محادثة Bytly AI مع العميل تلقائياً عند موافقة العميل على مرحلة في المشروع",
    "sourceFile": "base44/workflows/طلب تقييم عند اكتمال مرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "milestoneReviewAgent"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "milestoneReviewAgent"
        }
      }
    ]
  },
  {
    "id": "source:فاتورة تلقائية عند موافقة العميل على المرحلة.jsonc",
    "name": "فاتورة تلقائية عند موافقة العميل على المرحلة",
    "description": "ينشئ فاتورة تلقائياً ويرسل بريد إلكتروني مع رابط دفع Stripe عند موافقة العميل على مرحلة المشروع",
    "sourceFile": "base44/workflows/فاتورة تلقائية عند موافقة العميل على المرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "autoInvoiceOnMilestoneApproval"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "payments",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "generate_invoice",
        "config": {
          "source_function": "autoInvoiceOnMilestoneApproval"
        }
      }
    ]
  },
  {
    "id": "source:فحص إشعارات مشاريع المهام اليومي.jsonc",
    "name": "فحص إشعارات مشاريع المهام اليومي",
    "description": "يفحص المشاريع يومياً ويولد إشعارات للمعالم القريبة، المهام المتأخرة، تجاوز الميزانية، والتبعيات غير المكتملة",
    "sourceFile": "base44/workflows/فحص إشعارات مشاريع المهام اليومي.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "taskProjectAlerts"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 5 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "projects",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "taskProjectAlerts"
        }
      }
    ]
  },
  {
    "id": "source:فحص انتهاء الفترات التجريبية.jsonc",
    "name": "فحص انتهاء الفترات التجريبية",
    "description": "يتحقق يومياً من الفترات التجريبية وينبه المستخدمين قبل 15 يوم من الانتهاء",
    "sourceFile": "base44/workflows/فحص انتهاء الفترات التجريبية.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "checkTrialExpiry"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 6 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "checkTrialExpiry"
        }
      }
    ]
  },
  {
    "id": "source:فحص مواعيد استحقاق المراحل.jsonc",
    "name": "فحص مواعيد استحقاق المراحل",
    "description": "يعمل يومياً صباحاً للبحث عن مراحل تستحق خلال 1 أو 3 أو 7 أيام وإرسال تنبيهات استباقية",
    "sourceFile": "base44/workflows/فحص مواعيد استحقاق المراحل.jsonc",
    "sourceEntity": null,
    "sourceEvents": [],
    "sourceFunctions": [
      "checkMilestoneDueDates"
    ],
    "trigger_type": "schedule",
    "trigger_event": null,
    "schedule_cron": "0 5 * * *",
    "schedule_timezone": "UTC",
    "integration_trigger": "none",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "checkMilestoneDueDates"
        }
      }
    ]
  },
  {
    "id": "source:مزامنة استطلاعات الرأي إلى Google Sheets.jsonc",
    "name": "مزامنة استطلاعات الرأي إلى Google Sheets",
    "description": "حفظ إجابات استطلاعات الرأي تلقائياً في Google Sheets عند إنشائها",
    "sourceFile": "base44/workflows/مزامنة استطلاعات الرأي إلى Google Sheets.jsonc",
    "sourceEntity": "SurveyResponse",
    "sourceEvents": [
      "create"
    ],
    "sourceFunctions": [
      "syncSurveyToSheets"
    ],
    "trigger_type": "event",
    "trigger_event": null,
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "notifications",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "syncSurveyToSheets"
        }
      }
    ]
  },
  {
    "id": "source:مطالبة التقييم بعد اكتمال المرحلة.jsonc",
    "name": "مطالبة التقييم بعد اكتمال المرحلة",
    "description": "عند اكتمال أو اعتماد مرحلة، يُطالب العميل تلقائياً بتقييم المقاول/المورد والمهندس على جودة العمل وسرعة الإنجاز",
    "sourceFile": "base44/workflows/مطالبة التقييم بعد اكتمال المرحلة.jsonc",
    "sourceEntity": "ProjectMilestone",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "promptProviderReviewAfterMilestone"
    ],
    "trigger_type": "event",
    "trigger_event": "milestone_completed",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "promptProviderReviewAfterMilestone"
        }
      }
    ]
  },
  {
    "id": "source:معالجة ردود التقييم وتحديث المهندس.jsonc",
    "name": "معالجة ردود التقييم وتحديث المهندس",
    "description": "يحلل ردود العميل في محادثات التقييم ويحدث تقييم المهندس عند اكتمال التقييم",
    "sourceFile": "base44/workflows/معالجة ردود التقييم وتحديث المهندس.jsonc",
    "sourceEntity": "Review",
    "sourceEvents": [
      "update"
    ],
    "sourceFunctions": [
      "processReviewResponse"
    ],
    "trigger_type": "event",
    "trigger_event": "review_submitted",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "none",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "send_notification",
        "config": {
          "source_function": "processReviewResponse"
        }
      }
    ]
  },
  {
    "id": "source:نسخ احتياطي لشهادات المهندسين في Google Drive.jsonc",
    "name": "نسخ احتياطي لشهادات المهندسين في Google Drive",
    "description": "Backup engineer graduation and Saudi Engineers Council certificates to Google Drive automatically when an engineer registers or updates their documents",
    "sourceFile": "base44/workflows/نسخ احتياطي لشهادات المهندسين في Google Drive.jsonc",
    "sourceEntity": "Engineer",
    "sourceEvents": [
      "create",
      "update"
    ],
    "sourceFunctions": [
      "backupEngineerCertificates"
    ],
    "trigger_type": "event",
    "trigger_event": "engineer_registered",
    "schedule_cron": null,
    "schedule_timezone": null,
    "integration_trigger": "webhook",
    "category": "engineers",
    "is_active": true,
    "is_source_workflow": true,
    "run_count": 0,
    "last_run_status": "never_run",
    "actions": [
      {
        "action_type": "webhook_call",
        "config": {
          "source_function": "backupEngineerCertificates"
        }
      }
    ]
  }
];
