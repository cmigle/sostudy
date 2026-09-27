// Site settings. Edit these, no other file needs changing.
window.SOS = {
  // Where forms are sent. "/send.php" uses Hostinger (photo goes by email, nothing stored).
  // For Formspree, paste e.g. "https://formspree.io/f/abcdwxyz".
  formEndpoint: "/send.php",

  // Google Apps Script /exec URLs, one per founder (see apps-script/README.md).
  // Kept out of git: set them in config.local.js (copy config.local.example.js).
  calendarEndpoints: [],

  // Shortest window (minutes) still worth offering to a student.
  minSlot: 15,

  email: "sostudy.klausk@gmail.com",
  linkedin: "https://www.linkedin.com/company/sostudy-lt",
  instagram: "https://www.instagram.com/sostudy.lt/",

  // LinkedIn feed: Apps Script /exec URL (see apps-script/linkedin/README.md).
  // Empty or unreachable: the site shows the saved copy in /assets/data/linkedin.json.
  linkedinFeed: ""
};
