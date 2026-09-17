import { useState, useEffect, useMemo, useRef } from "react";
import {
  Plus, Pencil, Trash2, Search, X, TrendingUp, TrendingDown,
  ChevronDown, ChevronUp, Camera, CalendarDays, Clock, Users2,
  StickyNote, LayoutGrid, BarChart3, Loader2, ImagePlus,
  Sparkles, Heart, Flower2, Egg, GraduationCap, Sun, PartyPopper,
  Backpack, CalendarClock, Leaf, UtensilsCrossed, Gift, Truck,
  Smartphone, NotebookPen, CalendarRange
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, Cell
} from "recharts";

/* ---------------------------------------------------------------
   Design tokens
----------------------------------------------------------------*/
const COLORS = {
  cream: "#FBF8F2",
  card: "#FFFFFF",
  ink: "#231B14",
  muted: "#8B7F70",
  line: "#E6DECF",
  red: "#C41230",
  redDeep: "#8E0C22",
  gold: "#B9791F",
  green: "#2E6A46",
  blue: "#2A5478",
  purple: "#6C4B79",
  teal: "#1E7A72",
};

const LOCATIONS = [
  { key: "northgate", label: "Northgate" },
  { key: "northacademy", label: "North Academy" },
];

const CATEGORIES = [
  { key: "Community Event", color: COLORS.blue },
  { key: "Marketing Event", color: COLORS.red },
  { key: "Marketing Promotion", color: COLORS.teal },
  { key: "Catering Promotion", color: COLORS.green },
  { key: "Delivery Promotion", color: COLORS.blue },
  { key: "Mobile Promotion", color: COLORS.purple },
];
const catColor = (cat) => (CATEGORIES.find((c) => c.key === cat) || CATEGORIES[0]).color;

// Community Events and Marketing/Catering all show on the combined calendar tab;
// Mobile & Delivery promotions get their own tab since they're recurring cadences, not one-off dates.
const COMMUNITY_CATEGORY = "Community Event";
const CALENDAR_CATEGORIES = CATEGORIES.filter((c) => c.key !== "Mobile Promotion" && c.key !== "Delivery Promotion");
const RECURRING_CATEGORIES = CATEGORIES.filter((c) => c.key === "Mobile Promotion" || c.key === "Delivery Promotion");

const MONTH_ALIASES = {
  jan: "January", january: "January", feb: "February", february: "February",
  mar: "March", march: "March", apr: "April", april: "April", may: "May",
  jun: "June", june: "June", jul: "July", july: "July", aug: "August", august: "August",
  sep: "September", sept: "September", september: "September", oct: "October", october: "October",
  nov: "November", november: "November", dec: "December", december: "December",
};
function parseMonth(label) {
  if (!label) return null;
  const m = label.toLowerCase().match(/[a-z]+/);
  return (m && MONTH_ALIASES[m[0]]) || null;
}

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);

const round1 = (n) => Math.round(n * 10) / 10;

const avg = (arr, key) => {
  const vals = arr.map((d) => Number(d[key]) || 0);
  if (!vals.length) return 0;
  return round1(vals.reduce((a, b) => a + b, 0) / vals.length);
};

/* ---------------------------------------------------------------
   Seed data (reconstructed from the existing tracker, as a starting point)
----------------------------------------------------------------*/
const seedEvents = () => [
  {
    id: uid(), location: "northgate", category: "Marketing Event",
    name: "Mother's Day Flower + Free Entree",
    dates: [
      { id: uid(), year: "2026", month: "May", dateLabel: "May 8, 2026", timeRange: "8:30 – 10:30 AM", sales: 500, txns: 100,
        notes: "Giveaway a flower and entree to mothers, DINE-IN only. 75 flowers for the location.",
        staffing: "Mkt: 1 person handing out flowers · Ops: 1 register, 1 server, 1 bagger, 1 dining room", photos: [] },
      { id: uid(), year: "2025", month: "May", dateLabel: "May 9, 2025", timeRange: "8:30 – 10:30 AM", sales: 500, txns: 100,
        notes: "$420 in giveaway entrées + the flowers.", staffing: "", photos: [] },
    ],
  },
  {
    id: uid(), location: "northacademy", category: "Marketing Event",
    name: "Mother's Day Flower + Free Entree",
    dates: [
      { id: uid(), year: "2026", month: "May", dateLabel: "May 8, 2026", timeRange: "8:30 – 10:30 AM", sales: 300, txns: 80,
        notes: "Giveaway a flower and entree to mothers, DINE-IN only. 75 flowers for the location.",
        staffing: "Mkt: 1 person handing out flowers · Ops: 1 additional register, 1 additional server", photos: [] },
      { id: uid(), year: "2025", month: "May", dateLabel: "May 9, 2025", timeRange: "", sales: 569, txns: 70,
        notes: "Check that enough bread is pulled for the extra free entrées.", staffing: "", photos: [] },
    ],
  },
  {
    id: uid(), location: "northgate", category: "Marketing Event", name: "Cow Appreciation Day",
    dates: [
      { id: uid(), year: "2026", month: "July", dateLabel: "Jul 14, 2026", timeRange: "8 AM – 8 PM", sales: 3369, txns: 580,
        notes: "Hosted a lead-up event to drive sales pre-CAD; guests got a free cow headband with an LTO purchase.",
        staffing: "Need more dinner coverage through close.", photos: [] },
    ],
  },
  {
    id: uid(), location: "northacademy", category: "Marketing Event", name: "Cow Appreciation Day",
    dates: [
      { id: uid(), year: "2026", month: "July", dateLabel: "Jul 14, 2026", timeRange: "8 AM – 8 PM", sales: 3613, txns: 511,
        notes: "Hosted a lead-up event to drive sales pre-CAD; guests got a free cow headband with an LTO purchase.",
        staffing: "", photos: [] },
    ],
  },
];

/* ---------------------------------------------------------------
   Annual plan — months + recurring cadence (reconstructed from the
   2026 Catering & Marketing Calendar poster, as a starting point)
----------------------------------------------------------------*/
const MONTHS = [
  { key: "January", icon: Sparkles },
  { key: "February", icon: Heart },
  { key: "March", icon: Flower2 },
  { key: "April", icon: Egg },
  { key: "May", icon: GraduationCap },
  { key: "June", icon: Sun },
  { key: "July", icon: PartyPopper },
  { key: "August", icon: Backpack },
  { key: "September", icon: CalendarClock },
  { key: "October", icon: Leaf },
  { key: "November", icon: UtensilsCrossed },
  { key: "December", icon: Gift },
];

const seedPlan = () => ({
  vision: "To impact stories",
  months: {
    January: { marketing: ["Classic Cup Promo", "Upselling Focus"], catering: ["New Year's Parties", "Social Media Push"] },
    February: { marketing: ["V-Day Family Night", "Random Acts of Kindness", "Heart Trays"], catering: ["Big Game Reheatable Trays"] },
    March: { marketing: ["Spring Family Night", "Golden Ticket Cookie Promotion"], catering: ["Cookies For A Cause"] },
    April: { marketing: ["Easter Family Night"], catering: ["Easter Reheatable Trays"] },
    May: { marketing: ["Mother's Day Flower + Entrée", "USAFA Tailgate Party", "Ronald McDonald Event"], catering: ["Graduation Caterings"] },
    June: { marketing: ["Seasonal product contest", "New Life VBS"], catering: ["Father's Day", "Business of the Week", "Flyers", "Nugget Tray, get DOC"] },
    July: { marketing: ["Cow-ni-Val Family Night"], catering: ["4th of July catering", "Ford Amp ads", "Cotton Blossom Sponsorship"] },
    August: { marketing: ["Back-to-School Family Night"], catering: ["Reheatable Trays", "Gallons in DT display"] },
    September: { marketing: ["Open For Planning"], catering: ["Business of the week", "Residential Focus: gallons in the DT display"] },
    October: { marketing: ["Fall Family Night"], catering: ["Halloween Themed Trays"] },
    November: { marketing: ["Open For Planning"], catering: ["Thanksgiving Reheatable Trays", "Mac & Cheese Trays"] },
    December: { marketing: ["Santa Family Night", "Noon Year's Eve Party"], catering: ["Christmas Eve Reheatable Trays"] },
  },
  recurring: [
    { number: "3", label: "Mobile Promotions", cadence: "per month" },
    { number: "2", label: "Delivery Promotions", cadence: "per week" },
  ],
});

/* ---------------------------------------------------------------
   One-time data patch: Mother's Day, Cow Appreciation Day, and
   Cow-Ni-Val are marketing plays, not community events — only
   USAFA Parents Weekend is a true community event.
----------------------------------------------------------------*/
function reclassifyCategories(list) {
  const forceMarketing = ["mother's day", "cow appreciation day", "cow-ni-val"];
  const forceCommunity = ["parents weekend"];
  return list.map((e) => {
    const n = e.name.toLowerCase();
    if (forceMarketing.some((k) => n.includes(k)) && e.category !== "Marketing Event") {
      return { ...e, category: "Marketing Event" };
    }
    if (forceCommunity.some((k) => n.includes(k)) && e.category !== "Community Event") {
      return { ...e, category: "Community Event" };
    }
    return e;
  });
}

/* ---------------------------------------------------------------
   One-time data patch: backfill a `month` field on any date entry
   that doesn't have one yet, so the calendar tab can group it.
----------------------------------------------------------------*/
function ensureMonths(list) {
  return list.map((e) => ({
    ...e,
    dates: e.dates.map((d) => (d.month ? d : { ...d, month: parseMonth(d.dateLabel) || "January" })),
  }));
}

/* ---------------------------------------------------------------
   One-time data patch: add Cow-Ni-Val Family Night (Northgate) if
   it isn't already in the saved data, using 2025 + 2026 actuals.
----------------------------------------------------------------*/
function withCowNiVal(list) {
  const exists = list.some(
    (e) => e.location === "northgate" && e.name.toLowerCase().includes("cow-ni-val")
  );
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(),
      location: "northgate",
      category: "Marketing Event",
      name: "Cow-Ni-Val Family Night",
      dates: [
        {
          id: uid(), year: "2025", month: "July", dateLabel: "Jul 22, 2025", timeRange: "5:00 – 7:00 PM",
          sales: 747, txns: 31, notes: "", staffing: "", photos: [],
        },
        {
          id: uid(), year: "2026", month: "July", dateLabel: "Jul 21, 2026", timeRange: "",
          sales: 1478, txns: 100,
          notes: "Activities: bounce house, petting zoo, face painting, sno cones, popcorn. Need a new sno cone machine. Consider simplifying balloon + face painting — could a team member run it? More animals if possible.",
          staffing: "", photos: [],
        },
      ],
    },
  ];
}

function withUSAFAParentsWeekend(list) {
  const exists = list.some(
    (e) => e.location === "northgate" && e.name.toLowerCase().includes("parents weekend")
  );
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(),
      location: "northgate",
      category: "Community Event",
      name: "USAFA Parents Weekend",
      dates: [
        {
          id: uid(), year: "2025", month: "September", dateLabel: "Sept 3 – Sept 5, 2025", timeRange: "",
          sales: 0, txns: 0,
          notes: "Busy Thursday night, all day Friday, and Saturday breakfast. Daypart numbers below are last year's actuals.",
          staffing: "",
          photos: [],
          segments: [
            { id: uid(), label: "Thursday night dinner", sales: "$12.2k, +39%", txns: "" },
            { id: uid(), label: "Friday breakfast", sales: "+7%", txns: "" },
            { id: uid(), label: "Friday lunch", sales: "$13k, +16%", txns: "" },
            { id: uid(), label: "Friday dinner", sales: "+19%", txns: "" },
            { id: uid(), label: "Saturday breakfast", sales: "$9.5k, +23%", txns: "" },
          ],
        },
      ],
    },
  ];
}

function withUpsellingWeek(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("upselling week"));
  if (exists) return list;
  const makeDates = () => [{
    id: uid(), year: "2026", month: "January", dateLabel: "Jan 26 – Feb 1, 2026", timeRange: "",
    sales: 0, txns: 0, notes: "Week-long team focus on upselling across the menu.", staffing: "", photos: [],
  }];
  return [
    ...list,
    { id: uid(), location: "northgate", category: "Marketing Event", name: "Upselling Week", dates: makeDates() },
    { id: uid(), location: "northacademy", category: "Marketing Event", name: "Upselling Week", dates: makeDates() },
  ];
}

function withBigGameNuggetTray(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("nugget tray"));
  if (exists) return list;
  const makeDates = () => [{
    id: uid(), year: "2026", month: "February", dateLabel: "Feb 1, 2026", timeRange: "",
    sales: 0, txns: 0, notes: "Big Game Day nugget tray promotion.", staffing: "", photos: [],
  }];
  return [
    ...list,
    { id: uid(), location: "northgate", category: "Catering Promotion", name: "Big Game Day Nugget Tray Promotion", dates: makeDates() },
    { id: uid(), location: "northacademy", category: "Catering Promotion", name: "Big Game Day Nugget Tray Promotion", dates: makeDates() },
  ];
}

// One-time patch: record the 5,000-upsell result on the existing Upselling Week entries
function withUpsellCount(list) {
  const marker = "5,000 upsells";
  return list.map((e) => {
    if (!e.name.toLowerCase().includes("upselling week")) return e;
    return {
      ...e,
      dates: e.dates.map((d) => {
        if (d.notes.includes(marker)) return d;
        const addition = "Each store logged 5,000 upsells during the week.";
        return { ...d, notes: d.notes ? `${d.notes} ${addition}` : addition };
      }),
    };
  });
}

function withValentinesFamilyNight(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("valentine"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "Valentine's Day Family Night",
      dates: [{
        id: uid(), year: "2026", month: "February", dateLabel: "Feb 12, 2026", timeRange: "",
        sales: 724, txns: 30, notes: "", staffing: "", photos: [],
      }],
    },
    {
      id: uid(), location: "northacademy", category: "Marketing Event", name: "Valentine's Day Family Night",
      dates: [{
        id: uid(), year: "2026", month: "February", dateLabel: "Feb 12, 2026", timeRange: "",
        sales: 0, txns: 0, notes: "", staffing: "", photos: [],
      }],
    },
  ];
}

function withRandomActsOfKindnessDay(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("random acts of kindness"));
  if (exists) return list;
  const makeDates = () => [{
    id: uid(), year: "2026", month: "February", dateLabel: "Feb 17, 2026", timeRange: "",
    sales: 0, txns: 0, notes: "", staffing: "", photos: [],
  }];
  return [
    ...list,
    { id: uid(), location: "northgate", category: "Marketing Event", name: "National Random Acts of Kindness Day", dates: makeDates() },
    { id: uid(), location: "northacademy", category: "Marketing Event", name: "National Random Acts of Kindness Day", dates: makeDates() },
  ];
}

// One-time patch: note the heart-shaped trays on the existing Feb 12 Valentine's entries
function withHeartShapedTraysNote(list) {
  const marker = "Heart Shaped Trays";
  return list.map((e) => {
    if (!e.name.toLowerCase().includes("valentine")) return e;
    return {
      ...e,
      dates: e.dates.map((d) => {
        if (d.dateLabel !== "Feb 12, 2026" || d.notes.includes(marker)) return d;
        const addition = "Heart Shaped Trays — put all items in heart-shaped trays for 2 days before and the day of Valentine's Day.";
        return { ...d, notes: d.notes ? `${d.notes} ${addition}` : addition };
      }),
    };
  });
}

function withEasterBunnyEvents(list) {
  const out = [...list];
  if (!out.some((e) => e.name.toLowerCase().includes("breakfast with the easter bunny"))) {
    out.push({
      id: uid(), location: "northgate", category: "Marketing Event", name: "Breakfast with the Easter Bunny",
      dates: [{
        id: uid(), year: "2026", month: "April", dateLabel: "Apr 5, 2026", timeRange: "",
        sales: 0, txns: 40, notes: "", staffing: "", photos: [],
      }],
    });
  }
  if (!out.some((e) => e.name.toLowerCase().includes("dinner with the easter bunny"))) {
    out.push({
      id: uid(), location: "northacademy", category: "Marketing Event", name: "Dinner with the Easter Bunny",
      dates: [{
        id: uid(), year: "2026", month: "April", dateLabel: "Apr 2, 2026", timeRange: "",
        sales: 0, txns: 20, notes: "", staffing: "", photos: [],
      }],
    });
  }
  return out;
}

function withFirstDayOfSpringFamilyNight(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("first day of spring"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "First Day of Spring Family Night",
      dates: [{
        id: uid(), year: "2026", month: "March", dateLabel: "Mar 20, 2026", timeRange: "",
        sales: 1300, txns: 30, notes: "", staffing: "", photos: [],
      }],
    },
    {
      id: uid(), location: "northacademy", category: "Marketing Event", name: "First Day of Spring Family Night",
      dates: [{
        id: uid(), year: "2026", month: "March", dateLabel: "Mar 20, 2026", timeRange: "",
        sales: 1500, txns: 60, notes: "", staffing: "", photos: [],
      }],
    },
  ];
}

function withCookiesForCauseWeek(list) {
  const exists = list.some((e) => e.location === "northacademy" && e.name.toLowerCase().includes("cookies for a cause"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northacademy", category: "Catering Promotion", name: "Trilakes Cares Cookies for a Cause Week",
      dates: [{
        id: uid(), year: "2026", month: "March", dateLabel: "Mar 16 – Mar 22, 2026", timeRange: "",
        sales: 0, txns: 0,
        notes: "Only sold 254 extra cookies. Notes for next year: the flyer verbiage said 25 cents per cookie — would have landed better framed as a percentage per cookie. Try more signage or a balloon arch, and try sampling.",
        staffing: "", photos: [],
        segments: [{ id: uid(), label: "Extra cookies sold", sales: "254 cookies", txns: "" }],
      }],
    },
  ];
}

function withCookiesForCauseWeekNorthgate(list) {
  const exists = list.some((e) => e.location === "northgate" && e.name.toLowerCase().includes("cookies for a cause"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Catering Promotion", name: "Trilakes Cares Cookies for a Cause Week",
      dates: [{
        id: uid(), year: "2026", month: "March", dateLabel: "Mar 16 – Mar 22, 2026", timeRange: "",
        sales: 0, txns: 0,
        notes: "Sold about 200 extra cookies. Notes for next year: the flyer verbiage said 25 cents per cookie — would have landed better framed as a percentage per cookie. Try more signage or a balloon arch, and try sampling.",
        staffing: "", photos: [],
        segments: [{ id: uid(), label: "Extra cookies sold", sales: "~200 cookies", txns: "" }],
      }],
    },
  ];
}

function withGraduationCateringPromotion(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("graduation catering"));
  if (exists) return list;
  const note = "Particularly up in catering deliveries from previous years.";
  const makeDates = () => [{
    id: uid(), year: "2026", month: "May", dateLabel: "May 12 – May 30, 2026", timeRange: "",
    sales: 0, txns: 0, notes: note, staffing: "", photos: [],
  }];
  return [
    ...list,
    { id: uid(), location: "northgate", category: "Catering Promotion", name: "Graduation Catering Tray Promotion", dates: makeDates() },
    { id: uid(), location: "northacademy", category: "Catering Promotion", name: "Graduation Catering Tray Promotion", dates: makeDates() },
  ];
}

function withUSAFAGraduationTailgate(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("graduation tailgate"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "USAFA Graduation Tailgate Party",
      dates: [{
        id: uid(), year: "2026", month: "May", dateLabel: "May 28, 2026", timeRange: "",
        sales: 0, txns: 103, notes: "", staffing: "", photos: [],
        segments: [{ id: uid(), label: "Lunch", sales: "+17%", txns: "" }],
      }],
    },
  ];
}

function withNewLifeVBSWeek(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("new life vbs"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "New Life VBS Week",
      dates: [{
        id: uid(), year: "2026", month: "June", dateLabel: "Jun 22 – Jun 26, 2026", timeRange: "",
        sales: 7000, txns: 100,
        notes: "Next year, need to ensure the handout goes well all on the same day.",
        staffing: "", photos: [],
      }],
    },
  ];
}

function withDuckDuckJeepDay(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("duck duck jeep"));
  if (exists) return list;
  const note = "Not up in sales or transactions, but still a huge hit for customers. Notes for next year: make it clearer that it's drive-thru only and Jeeps only — but tell the team to give it out to people who ask! Be generous!";
  const makeDates = () => [{
    id: uid(), year: "2026", month: "July", dateLabel: "Jul 8, 2026", timeRange: "",
    sales: 0, txns: 0, notes: note, staffing: "", photos: [],
  }];
  return [
    ...list,
    { id: uid(), location: "northgate", category: "Marketing Event", name: "Duck Duck Jeep Day", dates: makeDates() },
    { id: uid(), location: "northacademy", category: "Marketing Event", name: "Duck Duck Jeep Day", dates: makeDates() },
  ];
}

function withDriveThruParty(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("drive thru party"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "Drive Thru Party",
      dates: [{
        id: uid(), year: "2026", month: "July", dateLabel: "Jul 24, 2026", timeRange: "12 – 1 PM",
        sales: 704, txns: 69, notes: "Gave away swag and some DOCs.", staffing: "", photos: [],
      }],
    },
  ];
}

function withSpringCarePackages(list) {
  const out = [...list];
  const note = "Ongoing program starting this date.";
  if (!out.some((e) => e.name.toLowerCase().includes("prep school care packages"))) {
    out.push({
      id: uid(), location: "northacademy", category: "Community Event", name: "Spring Prep School Care Packages",
      dates: [{
        id: uid(), year: "2026", month: "January", dateLabel: "Jan 15, 2026", timeRange: "",
        sales: 0, txns: 0, notes: note, staffing: "", photos: [],
      }],
    });
  }
  if (!out.some((e) => e.name.toLowerCase().includes("arnold hall cadet care packages"))) {
    out.push({
      id: uid(), location: "northgate", category: "Community Event", name: "Spring Arnold Hall Cadet Care Packages",
      dates: [{
        id: uid(), year: "2026", month: "January", dateLabel: "Jan 15, 2026", timeRange: "",
        sales: 0, txns: 0, notes: note, staffing: "", photos: [],
      }],
    });
  }
  return out;
}

function withNightToShineEvent(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("night to shine"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Community Event", name: "Night to Shine Event at New Life",
      dates: [{
        id: uid(), year: "2026", month: "February", dateLabel: "Feb 13, 2026", timeRange: "",
        sales: 0, txns: 0, notes: "Send Mini Moo and Handler.", staffing: "", photos: [],
      }],
    },
  ];
}

function withUSAFAGraduationPractice(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("graduation practice"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Marketing Event", name: "USAFA Graduation Practice",
      dates: [{
        id: uid(), year: "2026", month: "May", dateLabel: "May 27, 2026", timeRange: "",
        sales: 0, txns: 0, notes: "", staffing: "", photos: [],
        segments: [
          { id: uid(), label: "Breakfast", sales: "$1,000", txns: "" },
          { id: uid(), label: "Lunch", sales: "$3,000", txns: "" },
        ],
      }],
    },
  ];
}

function withAmpConcerts(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("amp concerts"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Community Event", name: "Amp Concerts",
      dates: [{
        id: uid(), year: "2026", month: "May", dateLabel: "May 23, 2026", timeRange: "",
        sales: 0, txns: 0, notes: "Ongoing program starting this date.", staffing: "", photos: [],
      }],
    },
  ];
}

function withClassRewards(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("class rewards"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Community Event", name: "Class Rewards",
      dates: [{
        id: uid(), year: "2026", month: "May", dateLabel: "May 22, 2026", timeRange: "8 – 10 PM",
        sales: 0, txns: 0, notes: "", staffing: "", photos: [],
      }],
    },
  ];
}

function withUSAFAIDay(list) {
  const exists = list.some((e) => e.name.toLowerCase().includes("i-day"));
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Community Event", name: "USAFA I-Day",
      dates: [{
        id: uid(), year: "2026", month: "June", dateLabel: "Jun 24, 2026", timeRange: "11 AM – 3 PM",
        sales: 0, txns: 0,
        notes: "Sent a Cow (costume) and Betsy, the USAFA concierge, primarily to advertise care packages and orders for A-Day.",
        staffing: "", photos: [],
      }],
    },
  ];
}

function withADayWeekend(list) {
  const exists = list.some((e) => e.name.toLowerCase() === "a-day");
  if (exists) return list;
  return [
    ...list,
    {
      id: uid(), location: "northgate", category: "Community Event", name: "A-Day",
      dates: [
        { id: uid(), year: "2026", month: "August", dateLabel: "Aug 4, 2026", timeRange: "",
          sales: 0, txns: 0, notes: "Very busy the night before A-Day.", staffing: "", photos: [] },
        { id: uid(), year: "2026", month: "August", dateLabel: "Aug 5, 2026", timeRange: "",
          sales: 0, txns: 0, notes: "A-Day — busy for breakfast.", staffing: "", photos: [] },
        { id: uid(), year: "2026", month: "August", dateLabel: "Aug 6, 2026", timeRange: "",
          sales: 0, txns: 0, notes: "Busy for breakfast the day after A-Day.", staffing: "", photos: [] },
      ],
    },
    {
      id: uid(), location: "northacademy", category: "Community Event", name: "A-Day",
      dates: [
        { id: uid(), year: "2026", month: "August", dateLabel: "Aug 5, 2026", timeRange: "",
          sales: 0, txns: 0, notes: "A-Day — busy for breakfast.", staffing: "", photos: [] },
      ],
    },
  ];
}

/* ---------------------------------------------------------------
   All one-time data patches, applied together in order on load
----------------------------------------------------------------*/
const EVENT_PATCHES = [
  withCowNiVal,
  withUSAFAParentsWeekend,
  withUpsellingWeek,
  withBigGameNuggetTray,
  withUpsellCount,
  withValentinesFamilyNight,
  withRandomActsOfKindnessDay,
  withHeartShapedTraysNote,
  withEasterBunnyEvents,
  withFirstDayOfSpringFamilyNight,
  withCookiesForCauseWeek,
  withCookiesForCauseWeekNorthgate,
  withGraduationCateringPromotion,
  withUSAFAGraduationTailgate,
  withNewLifeVBSWeek,
  withDuckDuckJeepDay,
  withDriveThruParty,
  withSpringCarePackages,
  withNightToShineEvent,
  withUSAFAGraduationPractice,
  withAmpConcerts,
  withClassRewards,
  withUSAFAIDay,
  withADayWeekend,
  reclassifyCategories,
  ensureMonths,
];
function applyEventPatches(list) {
  return EVENT_PATCHES.reduce((acc, fn) => fn(acc), list);
}

/* ---------------------------------------------------------------
   Image helper — downscale + compress before storing
----------------------------------------------------------------*/
function fileToCompressedDataURL(file, maxW = 480, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* ---------------------------------------------------------------
   Small UI atoms
----------------------------------------------------------------*/
function Stat({ label, value, positive }) {
  return (
    <div className="gg-stat">
      <div className="gg-stat-label">{label}</div>
      <div className="gg-stat-value">
        {positive ? <TrendingUp size={16} strokeWidth={2.5} /> : <TrendingDown size={16} strokeWidth={2.5} />}
        {value}
      </div>
    </div>
  );
}

function CategoryBadge({ category, size = "md" }) {
  const c = catColor(category);
  return (
    <span className={`gg-badge gg-badge-${size}`} style={{ color: c, borderColor: c + "55", background: c + "14" }}>
      {category}
    </span>
  );
}

function IconBtn({ onClick, title, children, danger }) {
  return (
    <button className={`gg-iconbtn${danger ? " gg-iconbtn-danger" : ""}`} onClick={onClick} title={title} type="button">
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   Confirm popover
----------------------------------------------------------------*/
function ConfirmDialog({ open, title, body, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="gg-overlay" onClick={onCancel}>
      <div className="gg-confirm" onClick={(e) => e.stopPropagation()}>
        <div className="gg-confirm-title">{title}</div>
        <div className="gg-confirm-body">{body}</div>
        <div className="gg-confirm-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="gg-btn gg-btn-danger" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Event (top-level) create/edit modal
----------------------------------------------------------------*/
function EventModal({ open, initial, defaultCategory, categoryOptions, onClose, onSave }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [location, setLocation] = useState(LOCATIONS[0].key);
  const options = categoryOptions || CATEGORIES;

  useEffect(() => {
    if (open) {
      setName(initial?.name || "");
      setCategory(initial?.category || defaultCategory || options[0].key);
      setLocation(initial?.location || LOCATIONS[0].key);
    }
  }, [open, initial, defaultCategory]);

  if (!open) return null;
  const canSave = name.trim().length > 0;

  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-head">
          <div className="gg-modal-title">{initial ? "Edit event" : "New event"}</div>
          <button className="gg-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>

        <label className="gg-field">
          <span>Event name</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Cow Appreciation Day" />
        </label>

        <label className="gg-field">
          <span>Category</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {options.map((c) => <option key={c.key} value={c.key}>{c.key}</option>)}
          </select>
        </label>

        <label className="gg-field">
          <span>Store</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            {LOCATIONS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
          </select>
        </label>

        <div className="gg-modal-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="gg-btn gg-btn-primary"
            disabled={!canSave}
            onClick={() => canSave && onSave({ name: name.trim(), category, location })}
          >
            {initial ? "Save changes" : "Create event"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Date-entry (occurrence) create/edit modal
----------------------------------------------------------------*/
function DateEntryModal({ open, initial, onClose, onSave }) {
  const [year, setYear] = useState("");
  const [month, setMonth] = useState(MONTHS[0].key);
  const [monthManual, setMonthManual] = useState(false);
  const [dateLabel, setDateLabel] = useState("");
  const [timeRange, setTimeRange] = useState("");
  const [sales, setSales] = useState("");
  const [txns, setTxns] = useState("");
  const [notes, setNotes] = useState("");
  const [staffing, setStaffing] = useState("");
  const [photos, setPhotos] = useState([]);
  const [segments, setSegments] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (open) {
      setYear(initial?.year || String(new Date().getFullYear()));
      setMonth(initial?.month || parseMonth(initial?.dateLabel) || MONTHS[new Date().getMonth()].key);
      setMonthManual(!!initial?.month);
      setDateLabel(initial?.dateLabel || "");
      setTimeRange(initial?.timeRange || "");
      setSales(initial?.sales ?? "");
      setTxns(initial?.txns ?? "");
      setNotes(initial?.notes || "");
      setStaffing(initial?.staffing || "");
      setPhotos(initial?.photos || []);
      setSegments((initial?.segments || []).map((s) => ({ ...s })));
    }
  }, [open, initial]);

  if (!open) return null;
  const canSave = dateLabel.trim().length > 0 && year.trim().length > 0;

  function handleDateLabelChange(v) {
    setDateLabel(v);
    if (!monthManual) {
      const guess = parseMonth(v);
      if (guess) setMonth(guess);
    }
  }

  function updateSegment(i, key, val) {
    setSegments((prev) => prev.map((s, idx) => (idx === i ? { ...s, [key]: val } : s)));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList).slice(0, Math.max(0, 4 - photos.length));
    if (!files.length) return;
    setBusy(true);
    try {
      const results = await Promise.all(files.map((f) => fileToCompressedDataURL(f)));
      setPhotos((p) => [...p, ...results].slice(0, 4));
    } catch {
      // ignore failed reads
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-head">
          <div className="gg-modal-title">{initial ? "Edit date" : "Add a date"}</div>
          <button className="gg-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="gg-field-row">
          <label className="gg-field" style={{ flex: "0 0 76px" }}>
            <span>Year</span>
            <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" inputMode="numeric" />
          </label>
          <label className="gg-field" style={{ flex: "0 0 128px" }}>
            <span>Month</span>
            <select value={month} onChange={(e) => { setMonth(e.target.value); setMonthManual(true); }}>
              {MONTHS.map((m) => <option key={m.key} value={m.key}>{m.key}</option>)}
            </select>
          </label>
          <label className="gg-field" style={{ flex: 2 }}>
            <span>Date</span>
            <input value={dateLabel} onChange={(e) => handleDateLabelChange(e.target.value)} placeholder="Jul 14, 2026 or Jun 22 – Jun 25, 2026" />
          </label>
        </div>
        <div className="gg-hint">The calendar tab groups events by month — pick the month this occurrence lands in.</div>

        <label className="gg-field">
          <span>Time</span>
          <input value={timeRange} onChange={(e) => setTimeRange(e.target.value)} placeholder="8 AM – 8 PM" />
        </label>

        <div className="gg-field-row">
          <label className="gg-field">
            <span>Overall sales increase ($)</span>
            <input value={sales} onChange={(e) => setSales(e.target.value)} placeholder="3369" inputMode="numeric" />
          </label>
          <label className="gg-field">
            <span>Overall transaction increase</span>
            <input value={txns} onChange={(e) => setTxns(e.target.value)} placeholder="580" inputMode="numeric" />
          </label>
        </div>
        <div className="gg-hint">Leave these blank if the event doesn't have one clean total — log it by daypart below instead.</div>

        <div className="gg-field">
          <span>Daypart / hour-by-hour breakdown (optional)</span>
          {segments.map((s, i) => (
            <div className="gg-segment-row" key={i}>
              <input
                className="gg-segment-label"
                value={s.label}
                onChange={(e) => updateSegment(i, "label", e.target.value)}
                placeholder="Thursday night dinner"
              />
              <input
                className="gg-segment-val"
                value={s.sales}
                onChange={(e) => updateSegment(i, "sales", e.target.value)}
                placeholder="$12.2k, +39%"
              />
              <input
                className="gg-segment-val"
                value={s.txns}
                onChange={(e) => updateSegment(i, "txns", e.target.value)}
                placeholder="txns, if known"
              />
              <button className="gg-iconbtn gg-iconbtn-danger" onClick={() => setSegments((prev) => prev.filter((_, idx) => idx !== i))} type="button">
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            className="gg-add-date-btn"
            type="button"
            onClick={() => setSegments((prev) => [...prev, { id: uid(), label: "", sales: "", txns: "" }])}
          >
            <Plus size={14} /> Add a daypart row
          </button>
        </div>

        <label className="gg-field">
          <span>Notes</span>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What happened, what to remember for next time…" />
        </label>

        <label className="gg-field">
          <span>Staffing</span>
          <input value={staffing} onChange={(e) => setStaffing(e.target.value)} placeholder="Mkt: 1 person on flowers · Ops: 1 extra register" />
        </label>

        <div className="gg-field">
          <span>Photos ({photos.length}/4)</span>
          <div className="gg-photo-row">
            {photos.map((src, i) => (
              <div className="gg-photo-thumb" key={i}>
                <img src={src} alt="" />
                <button className="gg-photo-remove" onClick={() => setPhotos((p) => p.filter((_, idx) => idx !== i))}>
                  <X size={12} />
                </button>
              </div>
            ))}
            {photos.length < 4 && (
              <button className="gg-photo-add" onClick={() => fileRef.current?.click()} disabled={busy} type="button">
                {busy ? <Loader2 size={18} className="gg-spin" /> : <ImagePlus size={18} />}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </div>

        <div className="gg-modal-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="gg-btn gg-btn-primary"
            disabled={!canSave}
            onClick={() => canSave && onSave({
              year: year.trim(), month, dateLabel: dateLabel.trim(), timeRange: timeRange.trim(),
              sales: Number(sales) || 0, txns: Number(txns) || 0, notes, staffing, photos,
              segments: segments.filter((s) => s.label.trim() || s.sales.trim() || s.txns.trim()),
            })}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Month plan edit modal
----------------------------------------------------------------*/
function MonthModal({ open, monthKey, initial, onClose, onSave }) {
  const [marketing, setMarketing] = useState("");
  const [catering, setCatering] = useState("");

  useEffect(() => {
    if (open) {
      setMarketing((initial?.marketing || []).join("\n"));
      setCatering((initial?.catering || []).join("\n"));
    }
  }, [open, initial]);

  if (!open) return null;
  const toList = (s) => s.split("\n").map((x) => x.trim()).filter(Boolean);

  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-head">
          <div className="gg-modal-title">{monthKey}</div>
          <button className="gg-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>
        <label className="gg-field">
          <span>Marketing — one item per line</span>
          <textarea rows={4} value={marketing} onChange={(e) => setMarketing(e.target.value)} placeholder="Family Night&#10;Seasonal promo" />
        </label>
        <label className="gg-field">
          <span>Catering — one item per line</span>
          <textarea rows={4} value={catering} onChange={(e) => setCatering(e.target.value)} placeholder="Reheatable trays&#10;Business of the week" />
        </label>
        <div className="gg-modal-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="gg-btn gg-btn-primary" onClick={() => onSave({ marketing: toList(marketing), catering: toList(catering) })}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function TextModal({ open, title, label, initial, onClose, onSave }) {
  const [val, setVal] = useState("");
  useEffect(() => { if (open) setVal(initial || ""); }, [open, initial]);
  if (!open) return null;
  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-head">
          <div className="gg-modal-title">{title}</div>
          <button className="gg-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>
        <label className="gg-field">
          <span>{label}</span>
          <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} />
        </label>
        <div className="gg-modal-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="gg-btn gg-btn-primary" onClick={() => onSave(val.trim())}>Save</button>
        </div>
      </div>
    </div>
  );
}

function RecurringModal({ open, initial, onClose, onSave }) {
  const [rows, setRows] = useState([]);
  useEffect(() => { if (open) setRows((initial || []).map((r) => ({ ...r }))); }, [open, initial]);
  if (!open) return null;

  function update(i, key, val) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [key]: val } : r)));
  }

  return (
    <div className="gg-overlay" onClick={onClose}>
      <div className="gg-modal" onClick={(e) => e.stopPropagation()}>
        <div className="gg-modal-head">
          <div className="gg-modal-title">Recurring marketing</div>
          <button className="gg-iconbtn" onClick={onClose}><X size={18} /></button>
        </div>
        {rows.map((r, i) => (
          <div className="gg-field-row" key={i} style={{ alignItems: "flex-end" }}>
            <label className="gg-field" style={{ flex: "0 0 60px" }}>
              <span>#</span>
              <input value={r.number} onChange={(e) => update(i, "number", e.target.value)} />
            </label>
            <label className="gg-field" style={{ flex: 2 }}>
              <span>Label</span>
              <input value={r.label} onChange={(e) => update(i, "label", e.target.value)} />
            </label>
            <label className="gg-field" style={{ flex: 1 }}>
              <span>Cadence</span>
              <input value={r.cadence} onChange={(e) => update(i, "cadence", e.target.value)} />
            </label>
            <button className="gg-iconbtn gg-iconbtn-danger" style={{ marginBottom: 12 }} onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button className="gg-add-date-btn" onClick={() => setRows((prev) => [...prev, { number: "1", label: "New promotion", cadence: "per month" }])} type="button">
          <Plus size={14} /> Add row
        </button>
        <div className="gg-modal-actions">
          <button className="gg-btn gg-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="gg-btn gg-btn-primary" onClick={() => onSave(rows)}>Save changes</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Annual plan tab
----------------------------------------------------------------*/
function AnnualPlan({ plan, onEditVision, onEditMonth, onEditRecurring }) {
  return (
    <div className="gg-plan">
      <div className="gg-plan-vision" onClick={onEditVision} title="Click to edit">
        <span className="gg-plan-vision-label">VISION</span>
        <span className="gg-plan-vision-text">{plan.vision || "Click to set a vision"}</span>
        <NotebookPen size={13} className="gg-plan-vision-edit" />
      </div>

      <div className="gg-plan-grid">
        {MONTHS.map(({ key, icon: Icon }) => {
          const m = plan.months[key] || { marketing: [], catering: [] };
          return (
            <div className="gg-month-card" key={key}>
              <div className="gg-month-banner">
                {key}
                <button className="gg-month-edit" onClick={() => onEditMonth(key, m)} title="Edit month">
                  <Pencil size={13} />
                </button>
              </div>
              <div className="gg-month-body">
                <Icon size={26} className="gg-month-icon" strokeWidth={1.5} />
                <div className="gg-month-section">
                  <div className="gg-month-section-label">Marketing</div>
                  {m.marketing.length ? (
                    <ul>{m.marketing.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  ) : <div className="gg-month-empty">Nothing planned yet</div>}
                </div>
                <div className="gg-month-divider" />
                <div className="gg-month-section">
                  <div className="gg-month-section-label">Catering</div>
                  {m.catering.length ? (
                    <ul>{m.catering.map((item, i) => <li key={i}>{item}</li>)}</ul>
                  ) : <div className="gg-month-empty">Nothing planned yet</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="gg-recurring">
        <div className="gg-recurring-title">Recurring marketing</div>
        <div className="gg-recurring-row">
          {plan.recurring.map((r, i) => (
            <div className="gg-recurring-item" key={i}>
              {r.label.toLowerCase().includes("delivery") ? <Truck size={22} /> : <Smartphone size={22} />}
              <div className="gg-recurring-number">{r.number}</div>
              <div className="gg-recurring-label">{r.label}<br />{r.cadence}</div>
            </div>
          ))}
          <button className="gg-iconbtn" onClick={onEditRecurring} title="Edit"><Pencil size={14} /></button>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   Single date-entry row inside a card
----------------------------------------------------------------*/
function DateRow({ entry, onEdit, onDelete }) {
  const [lightbox, setLightbox] = useState(null);
  const segments = entry.segments || [];
  const hasOverall = entry.sales > 0 || entry.txns > 0;
  return (
    <div className="gg-date-row">
      <div className="gg-date-row-top">
        <span className="gg-year-chip">{entry.year}</span>
        <span className="gg-date-meta"><CalendarDays size={13} /> {entry.dateLabel}</span>
        {entry.timeRange && <span className="gg-date-meta"><Clock size={13} /> {entry.timeRange}</span>}
        <div className="gg-date-row-actions">
          <IconBtn title="Edit" onClick={onEdit}><Pencil size={14} /></IconBtn>
          <IconBtn title="Delete" danger onClick={onDelete}><Trash2 size={14} /></IconBtn>
        </div>
      </div>
      {hasOverall && (
        <div className="gg-date-row-numbers">
          <span className="gg-num-sales">↑ ${entry.sales.toLocaleString()} sales</span>
          <span className="gg-num-txns">↑ {entry.txns.toLocaleString()} txns</span>
        </div>
      )}
      {segments.length > 0 && (
        <div className="gg-segments">
          {segments.map((s, i) => (
            <div className="gg-segment-chip" key={s.id || i}>
              <span className="gg-segment-chip-label">{s.label || "—"}</span>
              {s.sales && <span className="gg-segment-chip-val">{s.sales}</span>}
              {s.txns && <span className="gg-segment-chip-val">{s.txns}</span>}
            </div>
          ))}
        </div>
      )}
      {entry.notes && <div className="gg-date-note"><StickyNote size={13} />{entry.notes}</div>}
      {entry.staffing && <div className="gg-date-staffing"><Users2 size={13} />{entry.staffing}</div>}
      {entry.photos?.length > 0 ? (
        <div className="gg-photo-row">
          {entry.photos.map((src, i) => (
            <img
              className="gg-photo-thumb-sm gg-photo-clickable"
              key={i}
              src={src}
              alt="Setup photo"
              onClick={() => setLightbox(src)}
            />
          ))}
        </div>
      ) : (
        <button className="gg-photo-empty-btn" onClick={onEdit} type="button" title="Add photos of the setup">
          <Camera size={13} /> Add photos of the setup
        </button>
      )}

      {lightbox && (
        <div className="gg-overlay" onClick={() => setLightbox(null)}>
          <div className="gg-lightbox" onClick={(e) => e.stopPropagation()}>
            <button className="gg-iconbtn gg-lightbox-close" onClick={() => setLightbox(null)}><X size={18} /></button>
            <img src={lightbox} alt="Setup photo, full size" />
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Event card
----------------------------------------------------------------*/
function EventCard({ event, onEditEvent, onDeleteEvent, onAddDate, onEditDate, onDeleteDate }) {
  const [open, setOpen] = useState(true);
  const sorted = [...event.dates].sort((a, b) => Number(b.year) - Number(a.year));
  const withOverall = event.dates.filter((d) => d.sales > 0 || d.txns > 0);
  const segmentOnlyCount = event.dates.length - withOverall.length;
  const salesAvg = avg(withOverall, "sales");
  const txnsAvg = avg(withOverall, "txns");
  const span = event.dates.length;
  const color = catColor(event.category);

  return (
    <div className="gg-card" style={{ "--accent": color }}>
      <div className="gg-card-head">
        <div>
          <div className="gg-card-name">{event.name}</div>
          <CategoryBadge category={event.category} size="sm" />
        </div>
        <div className="gg-card-head-actions">
          <IconBtn title="Edit event" onClick={onEditEvent}><Pencil size={15} /></IconBtn>
          <IconBtn title="Delete event" danger onClick={onDeleteEvent}><Trash2 size={15} /></IconBtn>
        </div>
      </div>

      <div className="gg-card-stats">
        {withOverall.length > 0 ? (
          <>
            <Stat label="Avg sales increase" value={`$${salesAvg.toLocaleString()}`} positive />
            <Stat label="Avg transaction increase" value={txnsAvg.toLocaleString()} positive />
          </>
        ) : (
          <span className="gg-span-chip" style={{ marginLeft: 0 }}>Logged by daypart — see dates below</span>
        )}
        <span className="gg-span-chip">
          across {span} {span === 1 ? "date" : "dates"}{segmentOnlyCount > 0 && withOverall.length > 0 ? ` (${segmentOnlyCount} daypart-only)` : ""}
        </span>
      </div>

      <button className="gg-card-toggle" onClick={() => setOpen((o) => !o)} type="button">
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {open ? "Hide dates" : "Show dates"}
      </button>

      {open && (
        <div className="gg-card-body">
          {sorted.map((d) => (
            <DateRow key={d.id} entry={d} onEdit={() => onEditDate(d)} onDelete={() => onDeleteDate(d.id)} />
          ))}
          <button className="gg-add-date-btn" onClick={onAddDate} type="button">
            <Plus size={14} /> Add another date
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Calendar tab — one card per (event, date) occurrence, grouped by month
----------------------------------------------------------------*/
function CalendarEntryCard({ event, dateEntry, onEditEvent, onDeleteEvent, onEditDate, onDeleteDate, onAddDate }) {
  const color = catColor(event.category);
  const locLabel = LOCATIONS.find((l) => l.key === event.location)?.label || event.location;
  return (
    <div className="gg-card" style={{ "--accent": color }}>
      <div className="gg-card-head">
        <div>
          <div className="gg-card-name">{event.name}</div>
          <div className="gg-card-badges">
            <CategoryBadge category={event.category} size="sm" />
            <span className="gg-loc-chip">{locLabel}</span>
          </div>
        </div>
        <div className="gg-card-head-actions">
          <IconBtn title="Edit event" onClick={onEditEvent}><Pencil size={14} /></IconBtn>
          <IconBtn title="Delete event" danger onClick={onDeleteEvent}><Trash2 size={14} /></IconBtn>
        </div>
      </div>
      <div className="gg-card-body" style={{ paddingTop: 2 }}>
        <DateRow entry={dateEntry} onEdit={onEditDate} onDelete={onDeleteDate} />
        <button className="gg-add-date-btn" onClick={onAddDate} type="button">
          <Plus size={14} /> Add another date to this event
        </button>
      </div>
    </div>
  );
}

function EventsCalendar({ items, onEditEvent, onDeleteEvent, onEditDate, onDeleteDate, onAddDate }) {
  const groups = MONTHS.map(({ key, icon: Icon }) => ({
    key, Icon,
    items: items
      .filter((it) => (it.dateEntry.month || "January") === key)
      .sort((a, b) => Number(b.dateEntry.year) - Number(a.dateEntry.year)),
  }));

  return (
    <div className="gg-cal">
      {groups.map(({ key, Icon, items: monthItems }) => (
        <div className="gg-cal-month" key={key}>
          <div className="gg-cal-month-head">
            <Icon size={16} strokeWidth={1.75} />
            <span>{key}</span>
            <span className="gg-column-count">{monthItems.length}</span>
          </div>
          {monthItems.length === 0 ? (
            <div className="gg-empty">Nothing logged in {key} yet.</div>
          ) : (
            <div className="gg-cal-items">
              {monthItems.map(({ event, dateEntry }) => (
                <CalendarEntryCard
                  key={dateEntry.id}
                  event={event}
                  dateEntry={dateEntry}
                  onEditEvent={() => onEditEvent(event)}
                  onDeleteEvent={() => onDeleteEvent(event.id)}
                  onEditDate={() => onEditDate(event.id, dateEntry)}
                  onDeleteDate={() => onDeleteDate(event.id, dateEntry.id)}
                  onAddDate={() => onAddDate(event.id)}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------
   Overview tab
----------------------------------------------------------------*/
function Overview({ events }) {
  const byLocation = (locKey) => events.filter((e) => e.location === locKey);

  const summary = LOCATIONS.map((loc) => {
    const evs = byLocation(loc.key);
    const allDates = evs.flatMap((e) => e.dates);
    return {
      key: loc.key,
      label: loc.label,
      eventCount: evs.length,
      dateCount: allDates.length,
      avgSales: avg(allDates, "sales"),
      avgTxns: avg(allDates, "txns"),
    };
  });

  const chartData = CATEGORIES.map((c) => {
    const row = { category: c.key.replace(" Event", "").replace(" Promotion", "") };
    LOCATIONS.forEach((loc) => {
      const evs = events.filter((e) => e.location === loc.key && e.category === c.key);
      const dates = evs.flatMap((e) => e.dates);
      row[loc.key] = dates.length ? avg(dates, "sales") : 0;
    });
    return row;
  }).filter((r) => r[LOCATIONS[0].key] || r[LOCATIONS[1].key]);

  return (
    <div className="gg-overview">
      <div className="gg-overview-cards">
        {summary.map((s) => (
          <div className="gg-overview-card" key={s.key}>
            <div className="gg-overview-card-label">{s.label}</div>
            <div className="gg-overview-grid">
              <div><div className="gg-ov-num">{s.eventCount}</div><div className="gg-ov-cap">events tracked</div></div>
              <div><div className="gg-ov-num">{s.dateCount}</div><div className="gg-ov-cap">occurrences logged</div></div>
              <div><div className="gg-ov-num" style={{ color: COLORS.red }}>${s.avgSales.toLocaleString()}</div><div className="gg-ov-cap">avg sales lift</div></div>
              <div><div className="gg-ov-num" style={{ color: COLORS.red }}>{s.avgTxns.toLocaleString()}</div><div className="gg-ov-cap">avg txn lift</div></div>
            </div>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="gg-chart-card">
          <div className="gg-chart-title"><BarChart3 size={15} /> Avg sales lift by category, store vs. store</div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={COLORS.line} vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 12, fill: COLORS.muted, fontFamily: "Inter, sans-serif" }} axisLine={{ stroke: COLORS.line }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: COLORS.muted, fontFamily: "IBM Plex Mono, monospace" }} axisLine={false} tickLine={false} width={44} />
              <Tooltip
                contentStyle={{ fontFamily: "Inter, sans-serif", fontSize: 13, border: `1px solid ${COLORS.line}`, borderRadius: 8 }}
                formatter={(v) => [`$${Number(v).toLocaleString()}`, ""]}
              />
              <Legend wrapperStyle={{ fontFamily: "Inter, sans-serif", fontSize: 12 }} formatter={(v) => LOCATIONS.find((l) => l.key === v)?.label || v} />
              <Bar dataKey={LOCATIONS[0].key} name={LOCATIONS[0].key} fill={COLORS.red} radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey={LOCATIONS[1].key} name={LOCATIONS[1].key} fill={COLORS.gold} radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {chartData.length === 0 && (
        <div className="gg-empty">Add a few events to see the store comparison chart here.</div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   Main app
----------------------------------------------------------------*/
export default function GrowthGrid() {
  const [events, setEvents] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("events");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");

  const [eventModal, setEventModal] = useState(null); // { mode, initial, forLocation }
  const [dateModal, setDateModal] = useState(null); // { eventId, initial }
  const [confirm, setConfirm] = useState(null); // { title, body, onConfirm }

  const [plan, setPlan] = useState(null);
  const [monthModal, setMonthModal] = useState(null); // { key, initial }
  const [visionModal, setVisionModal] = useState(false);
  const [recurringModal, setRecurringModal] = useState(false);

  // Load from persisted storage (localStorage on GitHub Pages — see src/storage.js)
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("events", true);
        if (res?.value) {
          setEvents(applyEventPatches(JSON.parse(res.value)));
        } else {
          const seed = applyEventPatches(seedEvents());
          setEvents(seed);
          await window.storage.set("events", JSON.stringify(seed), true);
        }
      } catch {
        setEvents(applyEventPatches(seedEvents()));
      }
      try {
        const res2 = await window.storage.get("plan", true);
        if (res2?.value) {
          setPlan(JSON.parse(res2.value));
        } else {
          const seed2 = seedPlan();
          setPlan(seed2);
          await window.storage.set("plan", JSON.stringify(seed2), true);
        }
      } catch {
        setPlan(seedPlan());
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist on change (after initial load)
  useEffect(() => {
    if (!loaded) return;
    window.storage.set("events", JSON.stringify(events), true).catch(() => {});
  }, [events, loaded]);

  useEffect(() => {
    if (!loaded || !plan) return;
    window.storage.set("plan", JSON.stringify(plan), true).catch(() => {});
  }, [plan, loaded]);

  // Reset the category chip filter whenever the tab changes
  useEffect(() => {
    setCatFilter("all");
  }, [tab]);

  const calendarItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = [];
    events.forEach((e) => {
      if (!CALENDAR_CATEGORIES.some((c) => c.key === e.category)) return;
      if (catFilter !== "all" && e.category !== catFilter) return;
      e.dates.forEach((d) => {
        if (q) {
          const hay = [e.name, e.category, e.location, d.year, d.month, d.dateLabel].join(" ").toLowerCase();
          if (!hay.includes(q)) return;
        }
        items.push({ event: e, dateEntry: d });
      });
    });
    return items;
  }, [events, search, catFilter, tab]);

  const recurringFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events.filter((e) => {
      if (!RECURRING_CATEGORIES.some((c) => c.key === e.category)) return false;
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (!q) return true;
      const hay = [e.name, e.category, e.location, ...e.dates.map((d) => d.year)].join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [events, search, catFilter, tab]);

  function saveEvent(payload) {
    if (eventModal.mode === "edit") {
      setEvents((prev) => prev.map((e) => (e.id === eventModal.initial.id ? { ...e, ...payload } : e)));
    } else {
      setEvents((prev) => [...prev, { id: uid(), dates: [], ...payload }]);
    }
    setEventModal(null);
  }

  function saveDate(payload) {
    setEvents((prev) => prev.map((e) => {
      if (e.id !== dateModal.eventId) return e;
      if (dateModal.initial) {
        return { ...e, dates: e.dates.map((d) => (d.id === dateModal.initial.id ? { ...d, ...payload } : d)) };
      }
      return { ...e, dates: [...e.dates, { id: uid(), ...payload }] };
    }));
    setDateModal(null);
  }

  function deleteEvent(id) {
    setConfirm({
      title: "Delete this event?",
      body: "This removes all logged dates, notes, and photos for it.",
      onConfirm: () => {
        setEvents((prev) => prev.filter((e) => e.id !== id));
        setConfirm(null);
      },
    });
  }

  function deleteDate(eventId, dateId) {
    setConfirm({
      title: "Delete this date?",
      body: "This entry's numbers and notes will be removed.",
      onConfirm: () => {
        setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, dates: e.dates.filter((d) => d.id !== dateId) } : e)));
        setConfirm(null);
      },
    });
  }

  function saveMonth(payload) {
    setPlan((prev) => ({ ...prev, months: { ...prev.months, [monthModal.key]: payload } }));
    setMonthModal(null);
  }

  function saveVision(text) {
    setPlan((prev) => ({ ...prev, vision: text }));
    setVisionModal(false);
  }

  function saveRecurring(rows) {
    setPlan((prev) => ({ ...prev, recurring: rows }));
    setRecurringModal(false);
  }

  if (!loaded || !plan) {
    return (
      <div className="gg-root gg-loading">
        <Loader2 size={22} className="gg-spin" />
        <span>Loading Growth Grid…</span>
        <GGStyles />
      </div>
    );
  }

  return (
    <div className="gg-root">
      <GGStyles />

      <header className="gg-header">
        <div className="gg-header-inner">
          <div className="gg-brand">
            <div className="gg-logo">CFA</div>
            <div>
              <div className="gg-brand-title">Growth Grid</div>
              <div className="gg-brand-sub">Community events, marketing &amp; catering, by month · Northgate &amp; North Academy</div>
            </div>
          </div>
          <button
            className="gg-btn gg-btn-primary"
            onClick={() => setEventModal({
              mode: "new",
              initial: null,
              defaultCategory: tab === "recurring"
                ? (catFilter !== "all" ? catFilter : RECURRING_CATEGORIES[0].key)
                : (catFilter !== "all" ? catFilter : CALENDAR_CATEGORIES[0].key),
              categoryOptions: tab === "recurring" ? RECURRING_CATEGORIES : CALENDAR_CATEGORIES,
            })}
          >
            <Plus size={16} /> Add event
          </button>
        </div>
        <div className="gg-grid-texture" />
      </header>

      <div className="gg-shared-note">
        Edits are saved in this browser only — they aren't shared with teammates or synced between devices. This page is public, so don't paste anything sensitive.
      </div>

      <nav className="gg-tabs">
        <button className={`gg-tab${tab === "overview" ? " gg-tab-active" : ""}`} onClick={() => setTab("overview")}>
          <BarChart3 size={15} /> Overview
        </button>
        <button className={`gg-tab${tab === "events" ? " gg-tab-active" : ""}`} onClick={() => setTab("events")}>
          <CalendarDays size={15} /> Events
        </button>
        <button className={`gg-tab${tab === "recurring" ? " gg-tab-active" : ""}`} onClick={() => setTab("recurring")}>
          <Smartphone size={15} /> Mobile &amp; Delivery
        </button>
        <button className={`gg-tab${tab === "plan" ? " gg-tab-active" : ""}`} onClick={() => setTab("plan")}>
          <CalendarRange size={15} /> Annual Plan
        </button>
      </nav>

      <main className="gg-main">
        {tab === "overview" ? (
          <Overview events={events} />
        ) : tab === "plan" ? (
          <AnnualPlan
            plan={plan}
            onEditVision={() => setVisionModal(true)}
            onEditMonth={(key, initial) => setMonthModal({ key, initial })}
            onEditRecurring={() => setRecurringModal(true)}
          />
        ) : tab === "events" ? (
          <>
            <div className="gg-filters">
              <div className="gg-search">
                <Search size={15} />
                <input
                  placeholder="Search events by name, category, or year…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="gg-chips">
                <button className={`gg-chip${catFilter === "all" ? " gg-chip-active" : ""}`} onClick={() => setCatFilter("all")}>All</button>
                {CALENDAR_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className={`gg-chip${catFilter === c.key ? " gg-chip-active" : ""}`}
                    style={catFilter === c.key ? { background: c.color, borderColor: c.color, color: "#fff" } : { color: c.color, borderColor: c.color + "55" }}
                    onClick={() => setCatFilter(c.key)}
                  >
                    {c.key}
                  </button>
                ))}
              </div>
            </div>

            <EventsCalendar
              items={calendarItems}
              onEditEvent={(ev) => setEventModal({ mode: "edit", initial: ev, categoryOptions: CALENDAR_CATEGORIES })}
              onDeleteEvent={deleteEvent}
              onEditDate={(eventId, d) => setDateModal({ eventId, initial: d })}
              onDeleteDate={deleteDate}
              onAddDate={(eventId) => setDateModal({ eventId, initial: null })}
            />
          </>
        ) : (
          <>
            <div className="gg-filters">
              <div className="gg-search">
                <Search size={15} />
                <input
                  placeholder="Search mobile & delivery promotions…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="gg-chips">
                <button className={`gg-chip${catFilter === "all" ? " gg-chip-active" : ""}`} onClick={() => setCatFilter("all")}>All</button>
                {RECURRING_CATEGORIES.map((c) => (
                  <button
                    key={c.key}
                    className={`gg-chip${catFilter === c.key ? " gg-chip-active" : ""}`}
                    style={catFilter === c.key ? { background: c.color, borderColor: c.color, color: "#fff" } : { color: c.color, borderColor: c.color + "55" }}
                    onClick={() => setCatFilter(c.key)}
                  >
                    {c.key}
                  </button>
                ))}
              </div>
            </div>

            <div className="gg-columns">
              {LOCATIONS.map((loc) => {
                const locEvents = recurringFiltered.filter((e) => e.location === loc.key);
                return (
                  <div className="gg-column" key={loc.key}>
                    <div className="gg-column-head">
                      <span>{loc.label.toUpperCase()}</span>
                      <span className="gg-column-count">{locEvents.length}</span>
                    </div>
                    {locEvents.length === 0 && (
                      <div className="gg-empty">No promotions logged here yet.</div>
                    )}
                    {locEvents.map((ev) => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onEditEvent={() => setEventModal({
                          mode: "edit",
                          initial: ev,
                          categoryOptions: RECURRING_CATEGORIES,
                        })}
                        onDeleteEvent={() => deleteEvent(ev.id)}
                        onAddDate={() => setDateModal({ eventId: ev.id, initial: null })}
                        onEditDate={(d) => setDateModal({ eventId: ev.id, initial: d })}
                        onDeleteDate={(dateId) => deleteDate(ev.id, dateId)}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>

      <EventModal
        open={!!eventModal}
        initial={eventModal?.initial}
        defaultCategory={eventModal?.defaultCategory}
        categoryOptions={eventModal?.categoryOptions}
        onClose={() => setEventModal(null)}
        onSave={saveEvent}
      />
      <DateEntryModal
        open={!!dateModal}
        initial={dateModal?.initial}
        onClose={() => setDateModal(null)}
        onSave={saveDate}
      />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        body={confirm?.body}
        onCancel={() => setConfirm(null)}
        onConfirm={confirm?.onConfirm}
      />
      <MonthModal
        open={!!monthModal}
        monthKey={monthModal?.key}
        initial={monthModal?.initial}
        onClose={() => setMonthModal(null)}
        onSave={saveMonth}
      />
      <TextModal
        open={visionModal}
        title="Vision statement"
        label="Vision"
        initial={plan.vision}
        onClose={() => setVisionModal(false)}
        onSave={saveVision}
      />
      <RecurringModal
        open={recurringModal}
        initial={plan.recurring}
        onClose={() => setRecurringModal(false)}
        onSave={saveRecurring}
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   Styles
----------------------------------------------------------------*/
function GGStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap');

      .gg-root {
        background: ${COLORS.cream};
        color: ${COLORS.ink};
        font-family: 'Inter', sans-serif;
        min-height: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid ${COLORS.line};
      }
      .gg-loading {
        display: flex; align-items: center; justify-content: center; gap: 10px;
        padding: 60px 0; color: ${COLORS.muted};
      }
      .gg-spin { animation: gg-spin 1s linear infinite; }
      @keyframes gg-spin { to { transform: rotate(360deg); } }

      .gg-header { position: relative; background: ${COLORS.ink}; color: #fff; overflow: hidden; }
      .gg-grid-texture {
        position: absolute; inset: 0; pointer-events: none; opacity: 0.14;
        background-image:
          repeating-linear-gradient(0deg, transparent 0 27px, rgba(255,255,255,0.5) 27px 28px),
          repeating-linear-gradient(90deg, transparent 0 27px, rgba(255,255,255,0.5) 27px 28px);
        mask-image: linear-gradient(to right, transparent, black 40%, black 70%, transparent);
      }
      .gg-header-inner {
        position: relative; z-index: 1;
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 24px; flex-wrap: wrap; gap: 14px;
      }
      .gg-brand { display: flex; align-items: center; gap: 12px; }
      .gg-logo {
        width: 40px; height: 40px; border-radius: 50%; background: ${COLORS.red};
        display: flex; align-items: center; justify-content: center;
        font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 13px; letter-spacing: 0.5px;
        flex-shrink: 0;
      }
      .gg-brand-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px; letter-spacing: 0.2px; }
      .gg-brand-sub { font-size: 12.5px; color: #C9C2B6; margin-top: 2px; }

      .gg-shared-note {
        font-size: 12px; color: ${COLORS.muted}; background: #F2ECDD;
        padding: 7px 24px; border-bottom: 1px solid ${COLORS.line};
      }

      .gg-tabs { display: flex; gap: 4px; padding: 10px 24px 0; border-bottom: 1px solid ${COLORS.line}; }
      .gg-tab {
        display: flex; align-items: center; gap: 6px; padding: 9px 14px; font-size: 13.5px; font-weight: 600;
        color: ${COLORS.muted}; background: none; border: none; border-bottom: 2px solid transparent; cursor: pointer;
        border-radius: 6px 6px 0 0;
      }
      .gg-tab:hover { background: #F2ECDD; }
      .gg-tab-active { color: ${COLORS.red}; border-bottom-color: ${COLORS.red}; }

      .gg-main { padding: 20px 24px 40px; }

      .gg-filters { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 18px; }
      .gg-search {
        display: flex; align-items: center; gap: 8px; background: #fff; border: 1px solid ${COLORS.line};
        border-radius: 8px; padding: 8px 12px; flex: 1; min-width: 220px; color: ${COLORS.muted};
      }
      .gg-search input { border: none; outline: none; flex: 1; font-size: 13.5px; font-family: 'Inter', sans-serif; color: ${COLORS.ink}; background: transparent; }
      .gg-chips { display: flex; gap: 6px; flex-wrap: wrap; }
      .gg-chip {
        font-size: 12px; font-weight: 600; padding: 6px 11px; border-radius: 20px; border: 1px solid ${COLORS.line};
        background: #fff; color: ${COLORS.muted}; cursor: pointer; white-space: nowrap;
      }
      .gg-chip-active { color: #fff !important; }

      .gg-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
      @media (max-width: 720px) { .gg-columns { grid-template-columns: 1fr; } }

      .gg-cal-month { margin-bottom: 28px; }
      .gg-cal-month-head {
        display: flex; align-items: center; gap: 8px;
        font-family: 'Fraunces', serif; font-weight: 600; font-size: 17px; color: ${COLORS.ink};
        padding-bottom: 8px; margin-bottom: 14px; border-bottom: 2px solid ${COLORS.ink};
      }
      .gg-cal-items { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
      @media (max-width: 720px) { .gg-cal-items { grid-template-columns: 1fr; } }

      .gg-card-badges { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .gg-loc-chip {
        font-size: 10.5px; font-weight: 600; color: ${COLORS.muted}; background: #F2ECDD;
        border-radius: 20px; padding: 2px 9px;
      }

      .gg-column-head {
        display: flex; justify-content: space-between; align-items: baseline;
        font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 1px;
        color: ${COLORS.muted}; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 1px solid ${COLORS.line};
      }
      .gg-column-count {
        background: ${COLORS.ink}; color: #fff; border-radius: 10px; padding: 1px 8px; font-size: 11px;
      }

      .gg-empty { color: ${COLORS.muted}; font-size: 13px; padding: 20px 4px; text-align: center; border: 1px dashed ${COLORS.line}; border-radius: 10px; }

      .gg-card {
        background: ${COLORS.card}; border-radius: 12px; border: 1px solid ${COLORS.line};
        border-left: 4px solid var(--accent); margin-bottom: 16px; overflow: hidden;
      }
      .gg-card-head { display: flex; justify-content: space-between; align-items: flex-start; padding: 14px 16px 4px; gap: 8px; }
      .gg-card-name { font-family: 'Fraunces', serif; font-weight: 600; font-size: 16.5px; margin-bottom: 5px; }
      .gg-card-head-actions { display: flex; gap: 2px; flex-shrink: 0; }

      .gg-badge {
        display: inline-block; border: 1px solid; border-radius: 20px; font-weight: 600; letter-spacing: 0.2px;
      }
      .gg-badge-sm { font-size: 10.5px; padding: 2px 9px; }
      .gg-badge-md { font-size: 12px; padding: 3px 10px; }

      .gg-card-stats { display: flex; align-items: center; gap: 22px; padding: 8px 16px 12px; flex-wrap: wrap; }
      .gg-stat-label { font-size: 10.5px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 2px; }
      .gg-stat-value {
        display: flex; align-items: center; gap: 5px; font-family: 'IBM Plex Mono', monospace; font-weight: 600;
        font-size: 19px; color: ${COLORS.green};
      }
      .gg-span-chip { font-size: 11px; color: ${COLORS.muted}; background: #F2ECDD; padding: 3px 9px; border-radius: 20px; margin-left: auto; }

      .gg-card-toggle {
        display: flex; align-items: center; gap: 5px; width: 100%; justify-content: center;
        background: #FAF7F0; border: none; border-top: 1px solid ${COLORS.line}; padding: 7px 0;
        font-size: 12px; color: ${COLORS.muted}; cursor: pointer; font-weight: 600;
      }
      .gg-card-toggle:hover { background: #F2ECDD; }

      .gg-card-body { padding: 4px 16px 14px; }
      .gg-date-row { padding: 12px 0; border-bottom: 1px solid ${COLORS.line}; }
      .gg-date-row:last-of-type { border-bottom: none; }
      .gg-date-row-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .gg-year-chip {
        background: ${COLORS.ink}; color: #fff; font-family: 'IBM Plex Mono', monospace; font-size: 11.5px;
        font-weight: 600; padding: 2px 9px; border-radius: 6px;
      }
      .gg-date-meta { display: flex; align-items: center; gap: 4px; font-size: 12px; color: ${COLORS.muted}; }
      .gg-date-row-actions { display: flex; gap: 2px; margin-left: auto; }

      .gg-date-row-numbers { display: flex; gap: 16px; margin-top: 7px; font-family: 'IBM Plex Mono', monospace; font-size: 13px; font-weight: 600; }
      .gg-num-sales { color: ${COLORS.green}; }
      .gg-num-txns { color: ${COLORS.blue}; }

      .gg-date-note, .gg-date-staffing {
        display: flex; gap: 6px; align-items: flex-start; font-size: 12.5px; color: ${COLORS.ink};
        margin-top: 6px; line-height: 1.45;
      }
      .gg-date-note svg, .gg-date-staffing svg { flex-shrink: 0; margin-top: 2px; color: ${COLORS.muted}; }
      .gg-date-staffing { color: ${COLORS.muted}; }

      .gg-add-date-btn {
        display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%;
        border: 1px dashed ${COLORS.line}; background: none; color: ${COLORS.muted}; font-size: 12.5px;
        font-weight: 600; padding: 9px 0; border-radius: 8px; margin-top: 10px; cursor: pointer;
      }
      .gg-add-date-btn:hover { border-color: ${COLORS.red}; color: ${COLORS.red}; background: ${COLORS.red}0A; }

      .gg-iconbtn {
        border: none; background: none; color: ${COLORS.muted}; cursor: pointer; padding: 5px; border-radius: 6px;
        display: flex; align-items: center;
      }
      .gg-iconbtn:hover { background: #F2ECDD; color: ${COLORS.ink}; }
      .gg-iconbtn-danger:hover { background: #FBEAEC; color: ${COLORS.red}; }

      .gg-btn {
        display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; font-weight: 600;
        padding: 9px 16px; border-radius: 8px; border: none; cursor: pointer; font-family: 'Inter', sans-serif;
      }
      .gg-btn-primary { background: ${COLORS.red}; color: #fff; }
      .gg-btn-primary:hover { background: ${COLORS.redDeep}; }
      .gg-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
      .gg-btn-ghost { background: none; color: ${COLORS.muted}; }
      .gg-btn-ghost:hover { background: #F2ECDD; }
      .gg-btn-danger { background: ${COLORS.red}; color: #fff; }
      .gg-btn-danger:hover { background: ${COLORS.redDeep}; }

      .gg-overlay {
        position: fixed; inset: 0; background: rgba(35,27,20,0.45); display: flex; align-items: center;
        justify-content: center; z-index: 50; padding: 16px;
      }
      .gg-modal {
        background: #fff; border-radius: 14px; padding: 20px; width: 420px; max-width: 100%;
        max-height: 90vh; overflow-y: auto;
      }
      .gg-modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
      .gg-modal-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 18px; }
      .gg-field { display: flex; flex-direction: column; gap: 5px; font-size: 12.5px; font-weight: 600; color: ${COLORS.muted}; margin-bottom: 12px; flex: 1; }
      .gg-hint { font-size: 11.5px; color: ${COLORS.muted}; margin: -6px 0 12px; line-height: 1.4; }
      .gg-field input, .gg-field select, .gg-field textarea {
        border: 1px solid ${COLORS.line}; border-radius: 8px; padding: 9px 11px; font-size: 13.5px;
        font-family: 'Inter', sans-serif; color: ${COLORS.ink}; outline: none; resize: vertical;
      }
      .gg-field input:focus, .gg-field select:focus, .gg-field textarea:focus { border-color: ${COLORS.red}; }
      .gg-field-row { display: flex; gap: 10px; }
      .gg-modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 6px; }

      .gg-segment-row { display: flex; gap: 6px; margin-bottom: 6px; align-items: center; }
      .gg-segment-label { flex: 1.4; border: 1px solid ${COLORS.line}; border-radius: 7px; padding: 7px 9px; font-size: 12.5px; font-family: 'Inter', sans-serif; outline: none; }
      .gg-segment-val { flex: 1; border: 1px solid ${COLORS.line}; border-radius: 7px; padding: 7px 9px; font-size: 12.5px; font-family: 'Inter', sans-serif; outline: none; }
      .gg-segment-label:focus, .gg-segment-val:focus { border-color: ${COLORS.red}; }

      .gg-segments { display: flex; flex-direction: column; gap: 5px; margin-top: 8px; background: #FAF7F0; border-radius: 8px; padding: 8px 10px; }
      .gg-segment-chip { display: flex; align-items: baseline; gap: 10px; font-size: 12px; flex-wrap: wrap; }
      .gg-segment-chip-label { color: ${COLORS.ink}; font-weight: 600; flex: 1; min-width: 120px; }
      .gg-segment-chip-val { font-family: 'IBM Plex Mono', monospace; font-weight: 600; color: ${COLORS.green}; }

      .gg-photo-row { display: flex; gap: 8px; flex-wrap: wrap; }
      .gg-photo-thumb { position: relative; width: 56px; height: 56px; border-radius: 8px; overflow: hidden; }
      .gg-photo-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .gg-photo-remove {
        position: absolute; top: 2px; right: 2px; background: rgba(0,0,0,0.6); color: #fff; border: none;
        border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer;
      }
      .gg-photo-add {
        width: 56px; height: 56px; border-radius: 8px; border: 1px dashed ${COLORS.line}; background: none;
        color: ${COLORS.muted}; display: flex; align-items: center; justify-content: center; cursor: pointer;
      }
      .gg-photo-add:hover { border-color: ${COLORS.red}; color: ${COLORS.red}; }
      .gg-photo-thumb-sm { width: 56px; height: 56px; border-radius: 6px; object-fit: cover; }
      .gg-photo-clickable { cursor: pointer; transition: transform 0.1s, box-shadow 0.1s; }
      .gg-photo-clickable:hover { transform: scale(1.04); box-shadow: 0 2px 8px rgba(0,0,0,0.18); }

      .gg-photo-empty-btn {
        display: flex; align-items: center; gap: 6px; margin-top: 8px; background: none;
        border: 1px dashed ${COLORS.line}; border-radius: 8px; padding: 7px 12px; font-size: 12px;
        color: ${COLORS.muted}; cursor: pointer; font-weight: 600;
      }
      .gg-photo-empty-btn:hover { border-color: ${COLORS.red}; color: ${COLORS.red}; background: ${COLORS.red}0A; }

      .gg-lightbox {
        max-width: 90vw; max-height: 90vh; position: relative; display: flex;
        align-items: center; justify-content: center;
      }
      .gg-lightbox img { max-width: 90vw; max-height: 90vh; border-radius: 10px; display: block; }
      .gg-lightbox-close {
        position: absolute; top: -14px; right: -14px; background: #fff; color: ${COLORS.ink};
        border-radius: 50%; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      }
      .gg-lightbox-close:hover { background: #fff; }

      .gg-confirm { background: #fff; border-radius: 12px; padding: 18px; width: 320px; }
      .gg-confirm-title { font-weight: 700; font-size: 15px; margin-bottom: 6px; }
      .gg-confirm-body { font-size: 13px; color: ${COLORS.muted}; margin-bottom: 16px; line-height: 1.4; }
      .gg-confirm-actions { display: flex; justify-content: flex-end; gap: 8px; }

      .gg-overview-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
      @media (max-width: 640px) { .gg-overview-cards { grid-template-columns: 1fr; } }
      .gg-overview-card { background: #fff; border: 1px solid ${COLORS.line}; border-radius: 12px; padding: 16px; }
      .gg-overview-card-label {
        font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 600; letter-spacing: 1px;
        color: ${COLORS.muted}; text-transform: uppercase; margin-bottom: 12px;
      }
      .gg-overview-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      .gg-ov-num { font-family: 'IBM Plex Mono', monospace; font-weight: 600; font-size: 21px; color: ${COLORS.ink}; }
      .gg-ov-cap { font-size: 11px; color: ${COLORS.muted}; margin-top: 1px; }

      .gg-chart-card { background: #fff; border: 1px solid ${COLORS.line}; border-radius: 12px; padding: 18px 14px 6px; }
      .gg-chart-title { display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 13.5px; margin-bottom: 6px; padding-left: 4px; }

      .gg-plan-vision {
        display: flex; align-items: center; justify-content: center; gap: 10px; cursor: pointer;
        margin-bottom: 22px; padding-bottom: 14px; border-bottom: 2px dotted ${COLORS.line};
      }
      .gg-plan-vision-label { font-family: 'IBM Plex Mono', monospace; font-size: 12px; font-weight: 700; color: ${COLORS.ink}; letter-spacing: 1px; }
      .gg-plan-vision-text { font-family: 'Fraunces', serif; font-weight: 600; font-size: 17px; color: ${COLORS.red}; }
      .gg-plan-vision-edit { color: ${COLORS.muted}; opacity: 0; transition: opacity 0.15s; }
      .gg-plan-vision:hover .gg-plan-vision-edit { opacity: 1; }

      .gg-plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
      @media (max-width: 900px) { .gg-plan-grid { grid-template-columns: 1fr 1fr; } }
      @media (max-width: 560px) { .gg-plan-grid { grid-template-columns: 1fr; } }

      .gg-month-card { border: 1.5px solid ${COLORS.red}55; border-radius: 12px; overflow: hidden; background: #fff; display: flex; flex-direction: column; }
      .gg-month-banner {
        background: ${COLORS.red}; color: #fff; font-family: 'Fraunces', serif; font-weight: 600; font-size: 14px;
        letter-spacing: 0.5px; text-align: center; padding: 8px 10px; position: relative;
      }
      .gg-month-edit {
        position: absolute; right: 8px; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.18);
        border: none; color: #fff; border-radius: 6px; padding: 4px; cursor: pointer; display: flex;
      }
      .gg-month-edit:hover { background: rgba(255,255,255,0.32); }
      .gg-month-body { padding: 14px 16px 16px; text-align: center; flex: 1; }
      .gg-month-icon { color: ${COLORS.red}; margin-bottom: 6px; }
      .gg-month-section-label { color: ${COLORS.red}; font-weight: 700; font-size: 12.5px; letter-spacing: 0.4px; margin-bottom: 6px; }
      .gg-month-section ul { list-style: none; padding: 0; margin: 0; }
      .gg-month-section li { font-size: 12.5px; line-height: 1.5; color: ${COLORS.ink}; margin-bottom: 2px; }
      .gg-month-empty { font-size: 12px; color: ${COLORS.muted}; font-style: italic; }
      .gg-month-divider { border-top: 2px dotted ${COLORS.line}; margin: 10px 0; }

      .gg-recurring { margin-top: 26px; border-top: 2px solid ${COLORS.ink}; padding-top: 16px; }
      .gg-recurring-title { text-align: center; font-family: 'Fraunces', serif; font-weight: 600; font-size: 15px; color: ${COLORS.red}; margin-bottom: 14px; }
      .gg-recurring-row { display: flex; align-items: center; justify-content: center; gap: 28px; flex-wrap: wrap; }
      .gg-recurring-item { display: flex; align-items: center; gap: 10px; color: ${COLORS.red}; }
      .gg-recurring-number { font-family: 'IBM Plex Mono', monospace; font-weight: 700; font-size: 30px; color: ${COLORS.blue}; }
      .gg-recurring-label { font-size: 12px; font-weight: 700; color: ${COLORS.ink}; line-height: 1.3; text-align: left; }
    `}</style>
  );
}
