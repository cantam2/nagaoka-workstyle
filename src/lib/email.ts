import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}
const FROM = process.env.EMAIL_FROM ?? 'Nagaoka Workstyle <onboarding@resend.dev>'
const SITE_URL = 'https://nagaoka-workstyle.vercel.app'

const statusLabels: Record<string, string> = {
  pending:   '未確認',
  reviewing: '書類確認中',
  accepted:  '採用',
  rejected:  '不採用',
}

function baseHtml(title: string, body: string) {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fbfd;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbfd;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:#2ea7c8;padding:24px 32px;">
            <span style="color:#fff;font-weight:900;font-size:20px;letter-spacing:-0.5px;">Nagaoka Workstyle</span>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <h1 style="margin:0 0 16px;font-size:18px;font-weight:900;color:#1a2332;">${title}</h1>
            ${body}
            <hr style="border:none;border-top:1px solid #eee;margin:28px 0;">
            <p style="margin:0;font-size:12px;color:#aaa;">
              このメールは <a href="${SITE_URL}" style="color:#2ea7c8;">長岡ワークスタイル</a> から自動送信されています。
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// 新規応募通知（企業担当者向け）
export async function sendNewApplicationEmail({
  to, companyName, jobTitle, applicantName, dashboardUrl,
}: {
  to: string
  companyName: string
  jobTitle: string
  applicantName: string
  dashboardUrl: string
}) {
  const body = `
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      <strong>${companyName}</strong> の求人「<strong>${jobTitle}</strong>」に、新しい応募が届きました。
    </p>
    <p style="color:#555;line-height:1.7;margin:0 0 24px;">
      応募者：<strong>${applicantName}</strong>
    </p>
    <a href="${dashboardUrl}" style="display:inline-block;background:#2ea7c8;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
      応募内容を確認する →
    </a>`

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `【長岡ワークスタイル】新しい応募が届きました — ${jobTitle}`,
    html: baseHtml('新しい応募が届きました', body),
  })
}

// 企業承認通知（企業担当者向け）
export async function sendApprovedEmail({
  to, companyName,
}: {
  to: string
  companyName: string
}) {
  const body = `
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      <strong>${companyName}</strong> の企業情報が管理者によって承認されました。<br>
      これより求人・インターンシップの掲載が可能になります。
    </p>
    <a href="${SITE_URL}/company/jobs/new" style="display:inline-block;background:#2ea7c8;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
      求人を掲載する →
    </a>`

  await getResend().emails.send({
    from: FROM,
    to,
    subject: '【長岡ワークスタイル】企業情報が承認されました',
    html: baseHtml('企業情報が承認されました', body),
  })
}

// ステータス変更通知（求職者向け）
export async function sendStatusChangedEmail({
  to, applicantName, jobTitle, status,
}: {
  to: string
  applicantName: string
  jobTitle: string
  status: string
}) {
  const label = statusLabels[status] ?? status
  const isAccepted = status === 'accepted'
  const isRejected = status === 'rejected'

  const accentColor = isAccepted ? '#16a34a' : isRejected ? '#dc2626' : '#2ea7c8'
  const badge = `<span style="display:inline-block;background:${accentColor};color:#fff;font-weight:700;padding:4px 14px;border-radius:20px;font-size:13px;">${label}</span>`

  const body = `
    <p style="color:#555;line-height:1.7;margin:0 0 16px;">
      ${applicantName} さん、<br>
      「<strong>${jobTitle}</strong>」の選考状況が更新されました。
    </p>
    <div style="background:#f8fbfd;border-radius:10px;padding:20px;margin:0 0 24px;text-align:center;">
      <p style="margin:0 0 8px;font-size:12px;color:#aaa;">現在のステータス</p>
      ${badge}
    </div>
    <a href="${SITE_URL}/jobseeker/applications" style="display:inline-block;background:#2ea7c8;color:#fff;font-weight:700;padding:12px 28px;border-radius:10px;text-decoration:none;font-size:14px;">
      応募状況を確認する →
    </a>`

  await getResend().emails.send({
    from: FROM,
    to,
    subject: `【長岡ワークスタイル】選考状況が更新されました — ${jobTitle}`,
    html: baseHtml('選考状況が更新されました', body),
  })
}
