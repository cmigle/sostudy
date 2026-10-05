// Site settings. Edit these, no other file needs changing.
window.SOS = {
  // Where forms are sent. "/send.php" uses Hostinger (photo goes by email, nothing stored).
  // For Formspree, paste e.g. "https://formspree.io/f/abcdwxyz".
  formEndpoint: "/send.php",

  // Google Apps Script /exec URLs, one per founder (see apps-script/README.md).
  calendarEndpoints: [],

  // Shortest window (minutes) still worth offering to a student.
  minSlot: 15,

  email: "sostudy.klausk@gmail.com",
  linkedin: "https://www.linkedin.com/company/sostudy-lt",
  instagram: "https://www.instagram.com/sostudy.lt/",

  // LinkedIn post URNs, newest first. On a post: ··· → Embed this post → copy the
  // "urn:li:share:..." or "urn:li:ugcPost:..." part of the iframe src.
  linkedinPosts: [
    "urn:li:share:7495111728746369025",
    "urn:li:ugcPost:7467163448536150016",
    "urn:li:ugcPost:7453524900633317377"
  ]
};
