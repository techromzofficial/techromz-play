export const INSTITUTE_CONTACT = {
  whatsappDisplay: '+94 77 366 3604',
  whatsappNumber: '94773663604',
  email: 'info@techromzit.com',
  enrolmentsEmail: 'enrolments@techromzit.com',
} as const;

export function getGeneralContactLinks() {
  const message = 'Hello Techromz Institute, I have a question about your courses, learning roadmaps or organisational training.';
  return {
    whatsapp: `https://wa.me/${INSTITUTE_CONTACT.whatsappNumber}?text=${encodeURIComponent(message)}`,
    email: `mailto:${INSTITUTE_CONTACT.email}?subject=${encodeURIComponent('Techromz Institute enquiry')}`,
  };
}

