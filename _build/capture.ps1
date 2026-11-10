$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $root 'prototipo\capturas'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$profile = Join-Path $env:TEMP 'ruta-capture-profile'
if (Test-Path $profile) { Remove-Item $profile -Recurse -Force }
$port = 9335

$proc = Start-Process -FilePath $chrome -ArgumentList @(
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--hide-scrollbars', "--remote-debugging-port=$port", "--user-data-dir=$profile", 'about:blank'
) -PassThru -WindowStyle Hidden

$wsUrl = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $targets = Invoke-RestMethod "http://127.0.0.1:$port/json/list" -ErrorAction Stop
    $page = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if ($page) { $wsUrl = $page.webSocketDebuggerUrl; break }
  } catch { }
}
if (-not $wsUrl) { throw 'No se pudo abrir Chrome para capturas.' }

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
  $buf = New-Object byte[] 524288
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
function Eval($expr) {
  $id = $script:cmdId; $script:cmdId++
  Send-Cdp $id 'Runtime.evaluate' @{ expression = $expr; awaitPromise = $true; returnByValue = $true }
  $r = Wait-Id $id
  if ($r.result.exceptionDetails) { throw ($r.result.exceptionDetails.text) }
  return $r.result.result.value
}

try {
  $id = $script:cmdId; $script:cmdId++
  Send-Cdp $id 'Page.enable' @{}; [void](Wait-Id $id)
  $id = $script:cmdId; $script:cmdId++
  Send-Cdp $id 'Emulation.setDeviceMetricsOverride' @{ width = 1440; height = 900; deviceScaleFactor = 1; mobile = $false }
  [void](Wait-Id $id)
  $id = $script:cmdId; $script:cmdId++
  Send-Cdp $id 'Page.navigate' @{ url = 'http://localhost:8123/' }; [void](Wait-Id $id)

  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 300
    try {
      if ((Eval "document.documentElement.dataset.rutaReady === '1'") -eq $true) { $ready = $true; break }
    } catch { }
  }
  if (-not $ready) { throw 'El prototipo no terminó de cargar.' }

  [void](Eval "window.RutaBienestar.reset(); window.RutaBienestar.demo(); 'ok'")
  Start-Sleep -Milliseconds 500

  function Capture-Phone($name, $setup) {
    [void](Eval $setup)
    Start-Sleep -Milliseconds 650
    $rect = Eval "var r = document.getElementById('phone').getBoundingClientRect(); ({x:r.x,y:r.y,width:r.width,height:r.height})"
    $id = $script:cmdId; $script:cmdId++
    Send-Cdp $id 'Page.captureScreenshot' @{
      format = 'png'
      fromSurface = $true
      captureBeyondViewport = $false
      clip = @{ x = [double]$rect.x; y = [double]$rect.y; width = [double]$rect.width; height = [double]$rect.height; scale = 2 }
    }
    $shot = Wait-Id $id
    $bytes = [Convert]::FromBase64String($shot.result.data)
    $path = Join-Path $outDir $name
    [System.IO.File]::WriteAllBytes($path, $bytes)
    "OK $name ($([math]::Round($bytes.Length/1KB)) KB)"
  }

  Capture-Phone '01-inicio.png' "window.RutaBienestar.goTo('home'); 'ok'"
  Capture-Phone '02-explorar.png' "window.RutaBienestar.goTo('explorar'); 'ok'"
  Capture-Phone '03-sami.png' "window.RutaBienestar.goTo('sami'); window.RutaBienestar.chat('Me siento muy ansioso por los parciales'); 'ok'"
  Capture-Phone '04-servicio.png' "window.RutaBienestar.openService('psicologia'); 'ok'"
  Capture-Phone '05-agendar.png' "window.RutaBienestar.book('psicologia'); 'ok'"
  Capture-Phone '06-confirmacion.png' "window.RutaBienestar.confirm(); 'ok'"
  Capture-Phone '07-mi-ruta.png' "window.RutaBienestar.goTo('ruta'); 'ok'"
  Capture-Phone '08-onboarding.png' "window.RutaBienestar.goTo('onboarding'); 'ok'"

  # Panel de impacto y campaña (ancho de escritorio)
  [void](Eval "document.body.classList.remove('demo-mode'); window.scrollTo(0,0); 'ok'")
  Start-Sleep -Milliseconds 400

  function Capture-Section($name, $selector, $pad) {
    $rect = Eval "var el = document.querySelector('$selector'); el.scrollIntoView({block:'center'}); var r = el.getBoundingClientRect(); ({x:r.x,y:r.y,width:r.width,height:r.height,scrollY:window.scrollY})"
    Start-Sleep -Milliseconds 450
    $rect = Eval "var el = document.querySelector('$selector'); var r = el.getBoundingClientRect(); ({x:r.x,y:r.y,width:r.width,height:r.height,scrollY:window.scrollY})"
    $x = [math]::Max(0, [double]$rect.x - $pad)
    $y = [math]::Max(0, [double]($rect.y + $rect.scrollY) - $pad)
    $w = [double]$rect.width + ($pad * 2)
    $h = [double]$rect.height + ($pad * 2)
    $id = $script:cmdId; $script:cmdId++
    Send-Cdp $id 'Page.captureScreenshot' @{
      format = 'png'
      fromSurface = $true
      captureBeyondViewport = $true
      clip = @{ x = $x; y = $y; width = $w; height = $h; scale = 1.5 }
    }
    $shot = Wait-Id $id
    $bytes = [Convert]::FromBase64String($shot.result.data)
    $path = Join-Path $outDir $name
    [System.IO.File]::WriteAllBytes($path, $bytes)
    "OK $name ($([math]::Round($bytes.Length/1KB)) KB)"
  }

  Capture-Section '09-panel-impacto.png' '#impacto .dashboard' 18
  Capture-Section '10-campana.png' '#campana .campaign-grid' 18
}
finally {
  try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', $ct).Wait(2000) | Out-Null } catch { }
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch { }
}
