export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const userAgent = request.headers.get('user-agent') || '';
    
    // Lấy IP từ các header có thể có
    const ip = request.headers.get('cf-connecting-ip') || 
               request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'Unknown';
    
    // Xử lý các endpoint API
    if (path === '/ip') {
      return textResponse(ip);
    }
    
    if (path === '/user-agent') {
      return textResponse(userAgent);
    }
    
    if (path === '/json') {
      return jsonResponse(request, ip);
    }
    
    if (path === '/all') {
      return allHeadersResponse(request, ip);
    }
    
    // Nếu client yêu cầu JSON (curl với -H "Accept: application/json")
    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return jsonResponse(request, ip);
    }
    
    // Nếu là curl hoặc wget, trả về plain text
    if (userAgent.toLowerCase().includes('curl') || 
        userAgent.toLowerCase().includes('wget') ||
        userAgent.toLowerCase().includes('httpie')) {
      return textResponse(ip);
    }
    
    // Trả về HTML cho browser
    return htmlResponse(request, ip);
  }
};

function textResponse(text) {
  return new Response(text + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    }
  });
}

function jsonResponse(request, ip) {
  const data = {
    ip: ip,
    user_agent: request.headers.get('user-agent'),
    method: request.method,
    encoding: request.headers.get('accept-encoding'),
    language: request.headers.get('accept-language'),
    country: request.cf?.country || null,
    city: request.cf?.city || null,
    timezone: request.cf?.timezone || null,
  };
  
  return new Response(JSON.stringify(data, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}

function allHeadersResponse(request, ip) {
  let text = `IP: ${ip}\n\n`;
  text += 'Headers:\n';
  
  for (const [key, value] of request.headers.entries()) {
    text += `${key}: ${value}\n`;
  }
  
  if (request.cf) {
    text += '\nCloudflare Info:\n';
    text += JSON.stringify(request.cf, null, 2);
  }
  
  return textResponse(text);
}

function htmlResponse(request, ip) {
  const country = request.cf?.country || 'Unknown';
  const city = request.cf?.city || 'Unknown';
  const timezone = request.cf?.timezone || 'Unknown';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const host = request.headers.get('host') || '';
  
  const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>IP Info - What is my IP?</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #0f172a;
      min-height: 100vh;
      color: #e2e8f0;
      padding: 0;
      overflow-x: hidden;
    }
    
    .bg-pattern {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.15), transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.15), transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(168, 85, 247, 0.1), transparent 50%);
      z-index: 0;
    }
    
    .container {
      position: relative;
      z-index: 1;
      max-width: 1400px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    
    header {
      text-align: center;
      margin-bottom: 50px;
      padding: 40px 20px;
    }
    
    h1 {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 800;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 15px;
      letter-spacing: -1px;
    }
    
    .subtitle {
      color: #94a3b8;
      font-size: clamp(1rem, 2vw, 1.2rem);
    }
    
    .main-content {
      display: grid;
      grid-template-columns: 1fr;
      gap: 30px;
      margin-bottom: 40px;
    }
    
    .ip-card {
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 24px;
      padding: 60px 40px;
      text-align: center;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease;
    }
    
    .ip-card:hover {
      transform: translateY(-5px);
      border-color: rgba(99, 102, 241, 0.3);
    }
    
    .ip-label {
      color: #94a3b8;
      font-size: 1rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 20px;
    }
    
    .ip-display {
      font-size: clamp(2rem, 6vw, 4rem);
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      letter-spacing: 1px;
      word-break: break-all;
      margin-bottom: 10px;
    }
    
    .copy-ip-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      padding: 12px 30px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      margin-top: 20px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }
    
    .copy-ip-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    
    .info-card {
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 25px;
      transition: all 0.3s ease;
    }
    
    .info-card:hover {
      border-color: rgba(99, 102, 241, 0.3);
      transform: translateY(-3px);
    }
    
    .info-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    
    .info-label {
      color: #94a3b8;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    
    .info-value {
      color: #e2e8f0;
      font-size: 1.15rem;
      font-weight: 500;
      word-break: break-word;
    }
    
    .api-section {
      background: rgba(30, 41, 59, 0.5);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 16px;
      padding: 40px;
    }
    
    .api-section h2 {
      font-size: 1.8rem;
      margin-bottom: 10px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .api-description {
      color: #94a3b8;
      margin-bottom: 30px;
      font-size: 1.05rem;
    }
    
    .endpoints-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 15px;
    }
    
    .api-endpoint {
      background: rgba(15, 23, 42, 0.6);
      padding: 16px 20px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.1);
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Courier New', monospace;
      font-size: 0.95rem;
      color: #a78bfa;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }
    
    .api-endpoint:hover {
      border-color: rgba(99, 102, 241, 0.4);
      background: rgba(15, 23, 42, 0.8);
      transform: translateX(5px);
    }
    
    .api-endpoint::before {
      content: '$ ';
      color: #667eea;
      font-weight: bold;
    }
    
    .footer {
      text-align: center;
      margin-top: 60px;
      padding: 30px;
      color: #64748b;
      font-size: 0.95rem;
    }
    
    .footer a {
      color: #818cf8;
      text-decoration: none;
      transition: color 0.3s ease;
    }
    
    .footer a:hover {
      color: #a78bfa;
    }
    
    .toast {
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
      opacity: 0;
      transform: translateY(100px);
      transition: all 0.3s ease;
      z-index: 1000;
      font-weight: 600;
    }
    
    .toast.show {
      opacity: 1;
      transform: translateY(0);
    }
    
    @media (max-width: 768px) {
      .container {
        padding: 20px 15px;
      }
      
      header {
        padding: 20px 10px;
        margin-bottom: 30px;
      }
      
      .ip-card {
        padding: 40px 25px;
      }
      
      .api-section {
        padding: 25px 20px;
      }
      
      .endpoints-grid {
        grid-template-columns: 1fr;
      }
      
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="bg-pattern"></div>
  
  <div class="container">
    <header>
      <h1>🌐 What's My IP?</h1>
      <p class="subtitle">Fast, simple, and accurate IP address lookup</p>
    </header>
    
    <div class="main-content">
      <div class="ip-card">
        <div class="ip-label">Your IP Address</div>
        <div class="ip-display" id="ipAddress">${ip}</div>
        <button class="copy-ip-btn" onclick="copyIP('${ip}')">📋 Copy IP Address</button>
      </div>
    </div>
    
    <div class="info-grid">
      <div class="info-card">
        <div class="info-icon">🌍</div>
        <div class="info-label">Country</div>
        <div class="info-value">${country}</div>
      </div>
      
      <div class="info-card">
        <div class="info-icon">🏙️</div>
        <div class="info-label">City</div>
        <div class="info-value">${city}</div>
      </div>
      
      <div class="info-card">
        <div class="info-icon">🕐</div>
        <div class="info-label">Timezone</div>
        <div class="info-value">${timezone}</div>
      </div>
      
      <div class="info-card">
        <div class="info-icon">💻</div>
        <div class="info-label">User Agent</div>
        <div class="info-value" style="font-size: 0.9rem;">${userAgent}</div>
      </div>
    </div>
    
    <div class="api-section">
      <h2>📡 API Endpoints</h2>
      <p class="api-description">Use these endpoints to get your IP information programmatically</p>
      
      <div class="endpoints-grid">
        <div class="api-endpoint" onclick="copyText('curl https://${host}/')">
          curl https://${host}/
        </div>
        
        <div class="api-endpoint" onclick="copyText('curl https://${host}/json')">
          curl https://${host}/json
        </div>
        
        <div class="api-endpoint" onclick="copyText('curl https://${host}/ip')">
          curl https://${host}/ip
        </div>
        
        <div class="api-endpoint" onclick="copyText('curl https://${host}/user-agent')">
          curl https://${host}/user-agent
        </div>
        
        <div class="api-endpoint" onclick="copyText('curl https://${host}/all')">
          curl https://${host}/all
        </div>
      </div>
    </div>
    
    <div class="footer">
      ⚡ Powered by <strong>Cloudflare Workers</strong>
    </div>
  </div>
  
  <div class="toast" id="toast">Copied to clipboard!</div>
  
  <script>
    function copyIP(ip) {
      navigator.clipboard.writeText(ip).then(() => {
        showToast();
      });
    }
    
    function copyText(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast();
      });
    }
    
    function showToast() {
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2000);
    }
  </script>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    }
  });
}
