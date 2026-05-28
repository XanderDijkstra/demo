-- Allow the "received" status (inbound emails) alongside the existing
-- outbound states. handleInboundEmail() inserts rows with this status.

alter table outreach_emails drop constraint if exists outreach_emails_status_check;

alter table outreach_emails
  add constraint outreach_emails_status_check
  check (
    status in (
      'queued',
      'sent',
      'delivered',
      'bounced',
      'complained',
      'failed',
      'received'
    )
  );
