param(
  [Parameter(Mandatory = $true)][string]$Source,
  [Parameter(Mandatory = $true)][string]$Out,
  [string]$Title = "Ruta Bienestar",
  [switch]$NoHeader,
  [int]$Port = 9334
)

$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
if (-not (Test-Path $chrome)) { throw "No se encontró Chrome en $chrome" }

$root = Split-Path -Parent $PSScriptRoot
$build = Join-Path $env:TEMP 'ruta-bienestar-build'
if (Test-Path $build) { Remove-Item $build -Recurse -Force }
New-Item -ItemType Directory -Force -Path $build | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $build 'fonts') | Out-Null

$fontSource = Join-Path $root 'prototipo\assets\fonts'
Copy-Item (Join-Path $fontSource 'Fraunces-latin.woff2') (Join-Path $build 'fonts\Fraunces-latin.woff2')
Copy-Item (Join-Path $fontSource 'PlusJakartaSans-latin.woff2') (Join-Path $build 'fonts\PlusJakartaSans-latin.woff2')

$sourcePath = (Resolve-Path $Source).Path
$docHtml = Join-Path $build 'doc.html'

if ($sourcePath.ToLower().EndsWith('.md')) {
  $css = Get-Content (Join-Path $PSScriptRoot 'doc.css') -Raw -Encoding UTF8
  Copy-Item (Join-Path $PSScriptRoot 'doc.css') (Join-Path $build 'doc.css')
  $marked = Get-Content (Join-Path $env:TEMP 'marked.min.js') -Raw -Encoding UTF8
  $md = Get-Content $sourcePath -Raw -Encoding UTF8
  $titleJson = $Title | ConvertTo-Json -Compress
  if ($md -match '</script') { throw 'El Markdown contiene </script>; escápalo antes de continuar.' }
  $html = @"
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<title>$Title</title>
<link rel="stylesheet" href="doc.css">
<style>$css</style>
</head>
<body>
<main id="doc"></main>
<script>$marked</script>
<script id="md" type="text/markdown">$md</script>
<script>
(function () {
  var parsed = marked.parse(document.getElementById('md').textContent);
  var doc = document.getElementById('doc');
  doc.innerHTML = parsed;
  var heads = doc.querySelectorAll('h1');
  for (var i = 0; i < heads.length; i++) {
    if (heads[i].textContent.trim().toLowerCase() === 'referencias') {
      heads[i].id = 'referencias';
      var node = heads[i].nextElementSibling;
      while (node && node.tagName !== 'H1') {
        if (node.tagName === 'P') node.classList.add('reference');
        node = node.nextElementSibling;
      }
    }
  }
  document.title = $titleJson;
})();
</script>
</body>
</html>
"@
  [System.IO.File]::WriteAllText($docHtml, $html, [System.Text.UTF8Encoding]::new($false))
} else {
  Copy-Item $sourcePath $docHtml -Force
}

$profile = Join-Path $build 'chrome-profile'
$chromeArgs = @(
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  '--allow-file-access-from-files',
  "--remote-debugging-port=$Port",
  "--user-data-dir=$profile",
  'about:blank'
)
$proc = Start-Process -FilePath $chrome -ArgumentList $chromeArgs -PassThru -WindowStyle Hidden

$wsUrl = $null
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 250
  try {
    $targets = Invoke-RestMethod "http://127.0.0.1:$Port/json/list" -ErrorAction Stop
    $page = $targets | Where-Object { $_.type -eq 'page' } | Select-Object -First 1
    if ($page) { $wsUrl = $page.webSocketDebuggerUrl; break }
  } catch { }
}
if (-not $wsUrl) {
  try { Stop-Process -Id $proc.Id -Force } catch { }
  throw 'No se pudo abrir el navegador de impresión (CDP).'
}

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
  $buf = New-Object byte[] 262144
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

try {
  $id = 1
  Send-Cdp $id 'Page.enable' @{}; [void](Wait-Id $id)
  $id++
  $uri = 'file:///' + ($docHtml.Replace('\', '/'))
  Send-Cdp $id 'Page.navigate' @{ url = $uri }; [void](Wait-Id $id)

  $id++
  Send-Cdp $id 'Runtime.evaluate' @{
    expression = "document.fonts.ready.then(function(){ var ps = [].slice.call(document.querySelectorAll('.page')).map(function(p){ return { scroll: p.scrollHeight, client: p.clientHeight, rect: Math.round(p.getBoundingClientRect().height) }; }); return { paragraphs: document.querySelectorAll('p').length, title: document.title, height: document.body.scrollHeight, pages: ps, width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }; })"
    awaitPromise = $true
    returnByValue = $true
  }
  $check = Wait-Id $id
  $paragraphs = 0
  if ($check.result -and $check.result.result -and $check.result.result.value) {
    $paragraphs = [int]$check.result.result.value.paragraphs
    $layout = $check.result.result.value
    if ($layout.pages -and $layout.pages.Count -gt 0) {
      foreach ($pg in $layout.pages) {
        if ($pg.scroll -gt $pg.client + 2) {
          Write-Warning "Una página mide $($pg.scroll)px y su caja $($pg.client)px: posible desborde."
        }
      }
    }
    if ($layout.scrollWidth -gt $layout.width + 1) {
      Write-Warning "Desborde horizontal: $($layout.scrollWidth)px en un ancho de $($layout.width)px."
    }
  }
  if ($paragraphs -lt 3) { throw "El documento no se renderizó correctamente (párrafos: $paragraphs)." }

  Start-Sleep -Milliseconds 400

  $id++
  $header = '<div style="width:100%;font-family:Georgia,serif;font-size:9pt;color:#4a5a50;text-align:right;padding:0 .45in;"><span class="pageNumber"></span></div>'
  $footer = '<div></div>'
  $params = @{
    landscape = $false
    displayHeaderFooter = (-not $NoHeader)
    printBackground = $true
    scale = 1
    paperWidth = 8.5
    paperHeight = 11
    marginTop = 1.0
    marginBottom = 1.0
    marginLeft = 1.0
    marginRight = 1.0
    pageRanges = ''
    preferCSSPageSize = $false
    headerTemplate = $header
    footerTemplate = $footer
    transferMode = 'ReturnAsBase64'
  }
  Send-Cdp $id 'Page.printToPDF' $params
  $resp = Wait-Id $id
  if (-not $resp.result -or -not $resp.result.data) { throw 'Chrome no devolvió el PDF.' }
  $bytes = [Convert]::FromBase64String($resp.result.data)
  $outPath = [System.IO.Path]::GetFullPath($Out)
  $outDir = Split-Path -Parent $outPath
  if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Force -Path $outDir | Out-Null }
  [System.IO.File]::WriteAllBytes($outPath, $bytes)

  $latin = [System.Text.Encoding]::GetEncoding(28591).GetString($bytes)
  $pageCount = ([regex]::Matches($latin, '/Type\s*/Page[^s]')).Count
  "OK  $outPath  ($([math]::Round($bytes.Length/1KB)) KB, $pageCount páginas aprox.)"
}
finally {
  try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, 'done', $ct).Wait(2000) | Out-Null } catch { }
  try { Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue } catch { }
  Get-Process chrome -ErrorAction SilentlyContinue | Where-Object {
    $_.StartTime -gt (Get-Date).AddMinutes(-3) -and $_.Path -eq $chrome
  } | ForEach-Object {
    try {
      $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
      if ($cmd -like "*$profile*") { Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue }
    } catch { }
  }
}
