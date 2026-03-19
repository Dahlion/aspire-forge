using MailKit.Net.Smtp;
using MimeKit;

namespace AspireForge.ApiService.Email;

public class MailKitEmailService(IConfiguration configuration) : IEmailService
{
    public async Task SendAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        var smtpEndpoint = configuration.GetConnectionString("mailpit-smtp") ?? "localhost:1025";

        // Parse "host:port" connection string
        var parts = smtpEndpoint.Split(':');
        var host = parts[0];
        var port = parts.Length > 1 && int.TryParse(parts[1], out var p) ? p : 1025;

        var message = new MimeMessage();
        message.From.Add(MailboxAddress.Parse(configuration["Email:From"] ?? "noreply@aspireforge.local"));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var client = new SmtpClient();
        await client.ConnectAsync(host, port, MailKit.Security.SecureSocketOptions.None, ct);
        await client.SendAsync(message, ct);
        await client.DisconnectAsync(true, ct);
    }
}
