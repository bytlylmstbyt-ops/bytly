import { createClientFromRequest } from 'npm:@base44/sdk@0.8.41';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const isAuthenticated = await base44.auth.isAuthenticated();
        if (!isAuthenticated) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const body = await req.json();

        // Support both entity-automation payload and direct invocation:
        //   Automation: { event: { entity_id }, data: { ...message fields } }
        //   Direct:     { messageId, conversationId }
        const messageId = body.event?.entity_id || body.messageId;
        let message = body.data;

        if (!message && messageId) {
            const [msg] = await base44.asServiceRole.entities.Message.filter({ id: messageId });
            message = msg;
        }
        if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        const conversationId = message.conversation_id || body.conversationId;
        if (!conversationId) {
            return Response.json({ error: 'Conversation ID missing' }, { status: 400 });
        }

        // Get conversation to find participants
        const [conversation] = await base44.asServiceRole.entities.Conversation.filter({ 
            id: conversationId 
        });
        
        if (!conversation) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Get project details — skip if project_id is a non-entity reference (e.g. "quote_request")
        const projectId = conversation.project_id || message.project_id;
        let project = null;
        if (projectId && /^[a-f0-9]{24}$/.test(projectId)) {
            try {
                const [proj] = await base44.asServiceRole.entities.Project.filter({ id: projectId });
                project = proj;
            } catch (e) {
                console.log('Project lookup skipped:', e.message);
            }
        }

        // Notify all participants except the sender
        const recipientEmails = conversation.participants.filter(
            email => email !== message.sender_email
        );

        const notificationPromises = recipientEmails.map(recipientEmail => 
            base44.asServiceRole.entities.Notification.create({
                user_email: recipientEmail,
                title: `رسالة جديدة من ${message.sender_name}`,
                message: `${message.content?.substring(0, 100)}${message.content?.length > 100 ? '...' : ''}`,
                type: 'new_message',
                link: `/project-chat?id=${projectId}`,
                metadata: {
                    project_id: projectId,
                    project_title: project?.title,
                    conversation_id: conversationId,
                    message_id: messageId,
                    sender_name: message.sender_name,
                    sender_role: message.sender_role
                },
                is_read: false
            })
        );

        await Promise.all(notificationPromises);

        return Response.json({ 
            success: true, 
            notificationsSent: recipientEmails.length 
        });

    } catch (error) {
        console.error('Error in notifyNewMessage:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});