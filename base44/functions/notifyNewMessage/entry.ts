import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { messageId, conversationId } = await req.json();

        // Get the message
        const [message] = await base44.asServiceRole.entities.Message.filter({ id: messageId });
        if (!message) {
            return Response.json({ error: 'Message not found' }, { status: 404 });
        }

        // Get conversation to find participants
        const [conversation] = await base44.asServiceRole.entities.Conversation.filter({ 
            id: conversationId 
        });
        
        if (!conversation) {
            return Response.json({ error: 'Conversation not found' }, { status: 404 });
        }

        // Get project details
        const [project] = await base44.asServiceRole.entities.Project.filter({ 
            id: conversation.project_id 
        });

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
                link: `/project-chat?id=${conversation.project_id}`,
                metadata: {
                    project_id: conversation.project_id,
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