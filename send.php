<?php
// Sends form submissions (with the optional photo attached) to the founders.
// Nothing is written to disk: the upload lives in PHP's temp dir only for this request.

$TO   = ['sostudy.klausk@gmail.com'];                  // where submissions arrive
$FROM = 'no-reply@sostudy.lt';                           // must be a sostudy.lt address
$MAX_BYTES = 10 * 1024 * 1024;
$ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/gif'];

header('Content-Type: application/json; charset=utf-8');

function out($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }
function clean($s, $max = 5000) { return mb_substr(trim(str_replace("\0", '', (string)$s)), 0, $max); }
function oneline($s) { return preg_replace('/[\r\n]+/', ' ', clean($s, 200)); }
function enc($s) { return '=?UTF-8?B?' . base64_encode($s) . '?='; }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false, 'error' => 'POST only']);
if (!empty($_POST['_gotcha'])) out(200, ['ok' => true]); // bot: pretend success

$name  = oneline($_POST['vardas'] ?? '');
$email = filter_var(trim($_POST['email'] ?? ''), FILTER_VALIDATE_EMAIL);
$form  = oneline($_POST['forma'] ?? 'pagalba');
$text  = clean($_POST['klausimas'] ?? $_POST['zinute'] ?? '');

if ($name === '' || !$email || $text === '') out(422, ['ok' => false, 'error' => 'Trūksta privalomų laukų']);

$labels = [
  'vardas' => 'Vardas', 'pavarde' => 'Pavardė', 'email' => 'El. paštas', 'klase' => 'Klasė',
  'laikas' => 'Pageidaujamas laikas', 'klausimas' => 'Klausimas', 'zinute' => 'Žinutė', 'sutikimas' => 'Sutikimas'
];
$body = '';
foreach ($labels as $k => $label) {
  if (isset($_POST[$k]) && trim($_POST[$k]) !== '') $body .= "$label: " . clean($_POST[$k]) . "\n" . ($k === 'klausimas' || $k === 'zinute' ? "\n" : '');
}
$body .= "\nIšsiųsta: " . date('Y-m-d H:i') . " (sostudy.lt, forma: $form)\n";

$subject = $form === 'kontaktai' ? "Žinutė iš sostudy.lt: $name" : "SOS: $name" . (!empty($_POST['klase']) ? ', ' . oneline($_POST['klase']) . ' kl.' : '');

// Optional photo
$file = $_FILES['nuotrauka'] ?? null;
$attach = null;
if ($file && $file['error'] !== UPLOAD_ERR_NO_FILE) {
  if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) out(400, ['ok' => false, 'error' => 'Nepavyko įkelti nuotraukos']);
  if ($file['size'] > $MAX_BYTES) out(413, ['ok' => false, 'error' => 'Nuotrauka per didelė']);
  $mime = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
  if (!in_array($mime, $ALLOWED, true)) out(415, ['ok' => false, 'error' => 'Leidžiamos tik nuotraukos']);
  $fname = preg_replace('/[^\w.\-]+/u', '_', basename($file['name'])) ?: 'nuotrauka.jpg';
  $attach = ['name' => $fname, 'mime' => $mime, 'data' => file_get_contents($file['tmp_name'])];
}

$boundary = 'sos_' . bin2hex(random_bytes(12));
$headers = [
  'MIME-Version: 1.0',
  'From: ' . enc('SOStudy') . " <$FROM>",
  'Reply-To: ' . enc($name) . " <$email>",
  "Content-Type: multipart/mixed; boundary=\"$boundary\""
];
$msg  = "--$boundary\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n";
$msg .= chunk_split(base64_encode($body)) . "\r\n";
if ($attach) {
  $msg .= "--$boundary\r\nContent-Type: {$attach['mime']}; name=\"{$attach['name']}\"\r\n";
  $msg .= "Content-Transfer-Encoding: base64\r\nContent-Disposition: attachment; filename=\"{$attach['name']}\"\r\n\r\n";
  $msg .= chunk_split(base64_encode($attach['data'])) . "\r\n";
}
$msg .= "--$boundary--";

$ok = mail(implode(', ', $TO), enc($subject), $msg, implode("\r\n", $headers), "-f$FROM");
out($ok ? 200 : 500, $ok ? ['ok' => true] : ['ok' => false, 'error' => 'Laiško išsiųsti nepavyko']);
