export interface Post {
  slug: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  metaTitle: string;
  metaDescription: string;
}

export const posts: Post[] = [
  // TRADESPEOPLE
  {
    slug: 'gas-safety-certificate-reminder',
    title: 'How to never miss a gas safety certificate renewal',
    description: 'Gas certs expire. Fines don\'t wait. Here\'s how tradespeople stay compliant without spreadsheets.',
    category: 'tradespeople',
    readTime: '3 min',
    metaTitle: 'Gas Safety Certificate Reminder — Never Miss a Renewal | again',
    metaDescription: 'Stop tracking gas safety certificates on spreadsheets. Get a text reminder when renewals are due. Simple SMS reminders for UK tradespeople.',
  },
  {
    slug: 'tradesman-admin-reminder',
    title: 'The admin tasks every tradesman forgets (and how to fix it)',
    description: 'Invoices, certs, quotes, follow-ups. The stuff that doesn\'t feel like work but kills your business when you forget it.',
    category: 'tradespeople',
    readTime: '4 min',
    metaTitle: 'Tradesman Admin Reminder — Stop Forgetting the Important Stuff | again',
    metaDescription: 'Tradesmen forget admin because it doesn\'t feel like real work. SMS reminders for invoices, certs, quotes, and follow-ups.',
  },
  {
    slug: 'plumber-compliance-checklist',
    title: 'The recurring compliance checklist every plumber needs',
    description: 'Gas Safe registration, CPD, insurance renewals, van checks. All the things that come around again and again.',
    category: 'tradespeople',
    readTime: '4 min',
    metaTitle: 'Plumber Compliance Checklist — Recurring Tasks You Can\'t Forget | again',
    metaDescription: 'Gas Safe registration, CPD, insurance renewals — the recurring compliance tasks every UK plumber needs to track.',
  },
  {
    slug: 'electrician-recurring-tasks',
    title: 'Recurring tasks every electrician should have on autopilot',
    description: 'NICEIC renewal, PAT testing schedules, insurance. Set them up once, never think about them again.',
    category: 'tradespeople',
    readTime: '3 min',
    metaTitle: 'Electrician Recurring Tasks — Reminders for NICEIC, PAT Testing & More | again',
    metaDescription: 'NICEIC renewals, PAT testing schedules, insurance — recurring tasks every UK electrician needs reminders for.',
  },
  {
    slug: 'builder-invoice-reminder',
    title: 'Why builders lose money by forgetting to invoice',
    description: 'You finished the job three weeks ago. You still haven\'t invoiced. Sound familiar?',
    category: 'tradespeople',
    readTime: '3 min',
    metaTitle: 'Builder Invoice Reminder — Stop Losing Money on Late Invoicing | again',
    metaDescription: 'Builders lose thousands by forgetting to invoice. A simple text reminder ensures you get paid on time, every time.',
  },
  {
    slug: 'van-check-reminder-tradesmen',
    title: 'Weekly van checks: the 5-minute task tradesmen always skip',
    description: 'Tyres, oil, tools, stock. A weekly van check takes 5 minutes but nobody does it. Until something breaks.',
    category: 'tradespeople',
    readTime: '3 min',
    metaTitle: 'Van Check Reminder for Tradesmen — Weekly SMS Prompt | again',
    metaDescription: 'A weekly van check takes 5 minutes. A breakdown costs a day. Get a text reminder every Monday morning.',
  },

  // FREELANCERS
  {
    slug: 'how-to-remember-to-send-invoices',
    title: 'How to actually remember to send your invoices on time',
    description: 'You did the work. Now get paid. Why freelancers forget invoicing and the simplest fix that exists.',
    category: 'freelancers',
    readTime: '4 min',
    metaTitle: 'How to Remember to Send Invoices on Time — Freelancer Guide | again',
    metaDescription: 'Freelancers lose money by forgetting to invoice. Here\'s the simplest way to make sure it never happens again.',
  },
  {
    slug: 'freelancer-recurring-admin-tasks',
    title: 'The recurring admin tasks every freelancer ignores',
    description: 'Tax returns, invoice chasing, contract renewals, portfolio updates. The boring stuff that matters.',
    category: 'freelancers',
    readTime: '4 min',
    metaTitle: 'Freelancer Recurring Admin Tasks — The Stuff You Keep Putting Off | again',
    metaDescription: 'Tax returns, invoice chasing, contract renewals — the recurring admin tasks freelancers ignore until it costs them.',
  },
  {
    slug: 'self-employed-tax-deadline-reminder',
    title: 'Self-employed? Never miss a tax deadline again',
    description: 'HMRC doesn\'t care that you forgot. January 31st, July 31st, and the quarterly ones most people don\'t even know about.',
    category: 'freelancers',
    readTime: '3 min',
    metaTitle: 'Self-Employed Tax Deadline Reminder UK — Never Miss HMRC Dates | again',
    metaDescription: 'Self-employed tax deadlines in the UK: January 31st, July 31st, and quarterly payments on account. Get SMS reminders.',
  },
  {
    slug: 'freelancer-productivity-no-app',
    title: 'Why the best freelancer productivity tool isn\'t an app',
    description: 'You\'ve tried Notion. You\'ve tried Todoist. You\'ve tried Trello. What if the answer was simpler?',
    category: 'freelancers',
    readTime: '5 min',
    metaTitle: 'Best Freelancer Productivity Tool — No App Required | again',
    metaDescription: 'Freelancers don\'t need another app. They need something they can\'t ignore. SMS reminders beat every productivity tool.',
  },
  {
    slug: 'client-follow-up-reminder',
    title: 'The follow-up you keep forgetting to send',
    description: 'You said you\'d follow up on Monday. It\'s Thursday. They\'ve gone with someone else.',
    category: 'freelancers',
    readTime: '3 min',
    metaTitle: 'Client Follow-Up Reminder — Never Lose a Lead Again | again',
    metaDescription: 'Freelancers lose clients by forgetting to follow up. A simple text reminder on the right day changes everything.',
  },

  // GENERAL / BROAD
  {
    slug: 'sms-task-reminder-uk',
    title: 'SMS task reminders: why a text beats every notification',
    description: 'App notifications get swiped. Emails get buried. Texts get read. Here\'s why SMS is the most effective reminder.',
    category: 'productivity',
    readTime: '4 min',
    metaTitle: 'SMS Task Reminder UK — Why Texts Beat Every Notification | again',
    metaDescription: 'App notifications get ignored. Texts don\'t. SMS task reminders have a 98% open rate. Here\'s why they work.',
  },
  {
    slug: 'recurring-task-reminder-app',
    title: 'You don\'t need a recurring task app. You need a text.',
    description: 'Recurring task apps assume you\'ll open them. You won\'t. What if the reminder came to you instead?',
    category: 'productivity',
    readTime: '4 min',
    metaTitle: 'Recurring Task Reminder — No App Needed, Just SMS | again',
    metaDescription: 'Recurring task apps only work if you open them. SMS reminders come to you. The simplest recurring task system that exists.',
  },
  {
    slug: 'stop-forgetting-things-to-do',
    title: 'How to stop forgetting things you need to do',
    description: 'You\'re not lazy. You\'re not disorganised. You just have too many things competing for your attention.',
    category: 'productivity',
    readTime: '5 min',
    metaTitle: 'How to Stop Forgetting Things to Do — A Simple System | again',
    metaDescription: 'You keep forgetting recurring tasks because your brain isn\'t designed to remember them. Here\'s a system that never forgets.',
  },
  {
    slug: 'best-way-to-remember-recurring-tasks',
    title: 'The best way to remember recurring tasks (it\'s not what you think)',
    description: 'Calendars. To-do lists. Sticky notes. They all fail for the same reason. The best system doesn\'t need you to check anything.',
    category: 'productivity',
    readTime: '4 min',
    metaTitle: 'Best Way to Remember Recurring Tasks — Simple SMS System | again',
    metaDescription: 'Calendars and to-do lists fail because they need you to check them. The best recurring task system comes to you via text.',
  },
  {
    slug: 'text-message-reminder-service-uk',
    title: 'Text message reminder services: what exists in the UK',
    description: 'A straightforward look at SMS reminder options for UK individuals and small businesses.',
    category: 'productivity',
    readTime: '4 min',
    metaTitle: 'Text Message Reminder Service UK — SMS Reminders for Tasks | again',
    metaDescription: 'Looking for a text message reminder service in the UK? Compare options for recurring and one-off SMS task reminders.',
  },
  {
    slug: 'simple-task-reminder-no-app',
    title: 'The simplest task reminder that doesn\'t need an app',
    description: 'No download. No account. No dashboard. Just your phone number and the thing you keep putting off.',
    category: 'productivity',
    readTime: '3 min',
    metaTitle: 'Simple Task Reminder — No App to Download | again',
    metaDescription: 'Don\'t want another app? Get task reminders via SMS. No download, no dashboard. Just texts when things are due.',
  },

  // ONE-OFF TASKS
  {
    slug: 'one-off-reminder-text',
    title: 'One-off reminders: get texted once about the thing you\'ll forget',
    description: 'Doctor\'s appointment. MOT. That email you promised to send. Set a date, get a text, done.',
    category: 'features',
    readTime: '2 min',
    metaTitle: 'One-Off Reminder Text — Get a Single SMS When You Need It | again',
    metaDescription: 'Set a one-off reminder and get a text on the day. Doctor\'s appointments, MOT, deadlines. One text. Done.',
  },
  {
    slug: 'text-add-tasks-sms',
    title: 'Create tasks by text: just text ADD to your reminder number',
    description: 'No app. No website. Text "ADD chase payments weekly 9am" and it\'s set up. Manage everything from one SMS thread.',
    category: 'features',
    readTime: '2 min',
    metaTitle: 'Add Tasks by Text Message — SMS Task Creation | again',
    metaDescription: 'Create recurring tasks by text. Send "ADD chase payments weekly 9am" and it\'s done. No app needed.',
  },
  {
    slug: 'mot-reminder-text',
    title: 'MOT reminder by text: never get caught with an expired MOT',
    description: 'Your MOT expires once a year. You\'ll forget. We\'ll text you.',
    category: 'everyday',
    readTime: '2 min',
    metaTitle: 'MOT Reminder Text UK — Get a Text Before Your MOT Expires | again',
    metaDescription: 'Get a text message reminder before your MOT expires. Set it once, get reminded every year. Simple.',
  },
];
