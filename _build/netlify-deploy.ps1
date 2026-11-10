$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$zip = Join-Path $env:TEMP 'ruta-bienestar-site.zip'
$profile = Join-Path $env:TEMP 'ruta-netlify-profile'
if (Test-Path $profile) { Remove-Item $profile -Recurse -Force }
$port = 9337

$proc = Start-Process -FilePath $chrome -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', "--remote-debugging-port=$port", "--user-data-dir=$profile", 'about:blank'
) -PassThru -WindowStyle Hidden

$wsUrl = $null
for ($i = 0; $i -lt 80; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $targets = Invoke-RestMethod "http://127.0.0.1:$port/json/list" -ErrorAction Stop
    $page = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if ($page) { $wsUrl = $page.webSocketDebuggerUrl; break }
  } catch { }
}
if (-not $wsUrl) { throw 'No se pudo abrir Chrome.' }

$ws = New-Object System.Net.WebSockets.ClientWebSocket
$ct = [System.Threading.CancellationToken]::None
$ws.ConnectAsync([Uri]$wsUrl, $ct).Wait()

function Send-Cdp($id, $method, $params) {
  $payload = @{ id = $id; method = $method; params = $params } | ConvertTo-Json -Depth 30 -Compress
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($payload)
  $seg = [System.ArraySegment[byte]]::new($bytes)
  $ws.SendAsync($seg, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $ct).Wait()
}
function Receive-Cdp {
  $buf = New-Object byte[] 1048576
  $sb = New-Object System.Text.StringBuilder
  do {
    $seg = [System.ArraySegment[byte]]::new($buf)
    $res = $ws.ReceiveAsync($seg, $ct).Result
    [void]$sb.Append([System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count))
  } while (-not $res.EndOfMessage)
  return $sb.ToString()
}
function Wait-Id($id) {
  while ($true) {
    $msg = (Receive-Cdp) | ConvertFrom-Json
    if ($msg.id -eq $id) { return $msg }
  }
}
$script:cmdId = 1
function Cdp($method, $params) {
  $id = $script:cmdId; $script:cmdId++
  Send-Cdp $id $method $params
  $r = Wait-Id $id
  if ($r.error) { throw ("CDP error: " + ($r.error | ConvertTo-Json -Compress)) }
  return $r.result
}
function Eval($expr) {
  $r = Cdp 'Runtime.evaluate' @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
  if ($r.exceptionDetails) { throw ($r.exceptionDetails.text) }
  return $r.result.value
}

try {
  [void](Cdp 'Page.enable' @{})
  [void](Cdp 'Runtime.enable' @{})
  [void](Cdp 'DOM.enable' @{})
  [void](Cdp 'Page.navigate' @{ url = 'https://app.netlify.com/drop' })

  $found = $false
  for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Milliseconds 500
    try {
      if ((Eval "!!document.querySelector('#drop-hero-file')") -eq $true) { $found = $true; break }
    } catch { }
  }
  if (-not $found) { throw 'No apareció el campo de archivos de Netlify Drop.' }

  $doc = Cdp 'DOM.getDocument' @{ depth = -1; pierce = $true }
  $node = Cdp 'DOM.querySelector' @{ nodeId = $doc.root.nodeId; selector = '#drop-hero-file' }
  "input nodeId: $($node.nodeId)"
  if (-not $node.nodeId) { throw 'No se encontró el input de archivos.' }
  [void](Cdp 'DOM.setFileInputFiles' @{ files = @($zip); nodeId = $node.nodeId })

  $url = $null
  for ($i = 0; $i -lt 120; $i++) {
    Start-Sleep -Milliseconds 1000
    $state = Eval "({href: location.href, text: document.body.innerText, title: document.title})"
    if ($state.href -match 'netlify\.app' -and $state.href -notmatch 'app\.netlify\.com') { $url = $state.href; break }
    if ($state.text -match '(?i)(sign in|log in|iniciar sesión|create an account)') {
      "LOGIN_REQUIRED"
      $state.text.Substring(0, [Math]::Min(1200, $state.text.Length))
      break
    }
    if ($i % 10 -eq 0) { "waiting... $($state.href)" }
  }
  if ($url) { "PUBLIC_URL=$url" }
}
finally {
  try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', $ct).Wait(2000) | Out-Null } catch { }
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch { }
}
