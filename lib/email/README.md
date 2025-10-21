# Email System Documentation

## Overview
This email system provides a modular, template-based approach to sending emails in the SaaS dashboard application.

## Features
- ✅ Modular template system
- ✅ Multiple email providers (SMTP, SendGrid, Resend)
- ✅ Responsive HTML email templates
- ✅ TypeScript support
- ✅ Error handling and logging
- ✅ Easy to extend with new templates

## Configuration

### Environment Variables
Add these to your `.env.local` file:

```bash
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_NAME="Indian Learning Institute"
SMTP_FROM_EMAIL=noreply@indianlearning.com
```

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password as `SMTP_PASSWORD`

## Usage

### Basic Email Sending
```typescript
import { emailService } from '@/lib/email'

// Send email using a template
await emailService.sendEmail({
  to: 'user@example.com',
  template: 'enrollment.welcome',
  data: {
    studentName: 'John Doe',
    courseTitle: 'Advanced Mathematics',
    enrollmentId: 'ENR-12345',
    institutionName: 'Indian Learning Institute'
  }
})
```

### Available Templates
- `enrollment.welcome` - Welcome email for new enrollments
- `user.welcome` - Welcome email for new users
- `payment.confirmation` - Payment confirmation email

## Template System

### Directory Structure
```
lib/email/
├── index.ts                 # Main email service
├── types.ts                 # TypeScript interfaces
└── templates/
    ├── index.ts            # Template registry
    ├── enrollment/
    │   └── welcome.ts      # Enrollment templates
    ├── user/
    │   └── welcome.ts      # User templates
    ├── payment/
    │   └── confirmation.ts # Payment templates
    └── shared/
        ├── layout.ts       # Base email layout
        └── components.ts   # Reusable components
```

### Creating New Templates

1. Create a new template file in the appropriate directory:
```typescript
// lib/email/templates/notifications/reminder.ts
import { EmailTemplate } from '../../types'
import { createEmailLayout } from '../shared/layout'

export const paymentReminder: EmailTemplate = (data: any) => {
  const content = `
    <h2>Payment Reminder</h2>
    <p>Dear ${data.studentName},</p>
    <p>This is a reminder that your payment is due.</p>
  `

  return {
    subject: 'Payment Reminder',
    html: createEmailLayout({
      title: 'Payment Reminder',
      content,
      institutionName: data.institutionName
    })
  }
}
```

2. Register the template in `templates/index.ts`:
```typescript
import { paymentReminder } from './notifications/reminder'

export const emailTemplates = {
  // ... existing templates
  'notifications.payment-reminder': paymentReminder,
} as const
```

## Testing

### Test Email Endpoint
Use the test endpoint to verify email functionality:

```bash
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "template": "enrollment.welcome"}'
```

### Available Test Templates
- `enrollment.welcome`
- `user.welcome`
- `payment.confirmation`

## Integration Points

### Enrollment API
Emails are automatically sent when:
- A new enrollment is created
- Student receives welcome email with course details

### User Creation API
Emails are automatically sent when:
- A new user is created (student/tutor/admin)
- User receives welcome email with login credentials

## Error Handling

The email system includes comprehensive error handling:
- Email failures don't block the main API operations
- Errors are logged to the console
- Failed emails are logged with warnings
- System continues to function even if email service is down

## Performance

- Emails are sent synchronously (can be optimized later with queues)
- Email sending doesn't block API responses
- Failed emails don't affect user experience
- Easy to disable by setting `EMAIL_ENABLED=false`

## Future Enhancements

- [ ] Asynchronous email queue system
- [ ] Email delivery tracking
- [ ] Email analytics and reporting
- [ ] Template preview system
- [ ] A/B testing for email templates
- [ ] Email scheduling
- [ ] Multiple email providers support
