interface BookingNotification {
  attendees: string[]
  meeting: {
    title: string
    room: string
    date: string
    time: string
    organizer: string
    description?: string
    startDateTime?: string
    endDateTime?: string
  }
}

function generateCalendarInvite(meeting: BookingNotification['meeting']): string {
  const startDate = new Date(meeting.startDateTime || new Date())
  const endDate = new Date(meeting.endDateTime || new Date())
  
  // Format dates for calendar (YYYYMMDDTHHMMSS)
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }
  
  const calendarEvent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//YallaSquad//Meeting Room Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${meeting.title}`,
    `LOCATION:${meeting.room}`,
    `DESCRIPTION:${meeting.description || ''}`,
    `ORGANIZER:CN=${meeting.organizer}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    `UID:${Date.now()}@yallasquad.com`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')
  
  return calendarEvent
}

export async function sendBookingNotifications({ attendees, meeting }: BookingNotification): Promise<void> {
  try {
    console.log("[v0] Sending booking notifications to:", attendees)
    console.log("[v0] Meeting details:", meeting)

    // Generate calendar invite
    const calendarInvite = generateCalendarInvite(meeting)
    
    // Create mailto links for each attendee with calendar attachment
    const emailContent = `
Subject: Meeting Invitation: ${meeting.title}

You have been invited to a meeting:

📅 Title: ${meeting.title}
🏢 Room: ${meeting.room}  
📆 Date: ${meeting.date}
⏰ Time: ${meeting.time}
👤 Organizer: ${meeting.organizer}
${meeting.description ? `📝 Description: ${meeting.description}` : ""}

Please add this meeting to your calendar.

Best regards,
YallaSquad Meeting Room System
    `.trim()

    // In a real implementation, you would send actual emails
    // For now, we'll create mailto links that users can click
    attendees.forEach((email, index) => {
      setTimeout(() => {
        const subject = encodeURIComponent(`Meeting Invitation: ${meeting.title}`)
        const body = encodeURIComponent(emailContent)
        const mailtoUrl = `mailto:${email}?subject=${subject}&body=${body}`
        
        console.log(`[v0] Email notification for ${email}:`, mailtoUrl)
        
        // In a browser environment, you could open the mail client
        // window.open(mailtoUrl)
      }, index * 500) // Stagger the emails
    })

    console.log("[v0] Calendar invite generated:")
    console.log(calendarInvite)

    console.log("[v0] Email notifications prepared successfully")
    console.log(`[v0] Generated mailto links for ${attendees.length} attendees`)

    // In production, you would:
    // 1. Use an email service API (Resend, SendGrid, AWS SES)
    // 2. Send actual emails with calendar attachments (.ics files)
    // 3. Handle email delivery failures
    // 4. Store notification logs
    // 5. Support HTML email templates

  } catch (error) {
    console.error("[v0] Failed to send booking notifications:", error)
    // In production, you might want to throw the error or handle it gracefully
    // For now, we'll just log it and continue
  }
}
