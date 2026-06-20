import { config } from 'dotenv'
config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { careerRoles, careerAchievements } from './schema'

const sql = neon(process.env.DATABASE_URL!)
const db = drizzle(sql)

// ── Role seed data ──────────────────────────────────────────────────────────
// Extracted from career-lineage.html — 16 roles, sorted newest (16) → oldest (1)

interface RoleSeed {
  title: string
  company: string
  employmentType: 'employed' | 'self-employed'
  startDate: string   // YYYY-MM
  endDate: string | null
  summary: string
  sortOrder: number
  isCurrent: boolean
  achievements: AchievementSeed[]
}

interface AchievementSeed {
  theme: 'change-management' | 'data-analytics' | 'operational'
  description: string
  skillTags: string[]
  sortOrder: number
}

const ROLES: RoleSeed[] = [
  // ── 16: Aldi ──────────────────────────────────────────────────────────────
  {
    title: 'Data Engineer',
    company: 'Aldi Stores Ltd',
    employmentType: 'employed',
    startDate: '2023-12',
    endDate: null,
    summary: 'Across engineering and analytics for the national function. I build the platforms and deliver the insight that runs on them.',
    sortOrder: 16,
    isCurrent: true,
    achievements: [
      { theme: 'data-analytics', description: 'Picked up Databricks, PySpark, Unity Catalog, Delta Live Tables, and medallion architecture from the ground up.', skillTags: ['Databricks', 'PySpark', 'Unity Catalog', 'Delta Live Tables', 'Medallion Architecture'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Added Azure Data Factory and GitLab CI/CD to the pipeline toolkit.', skillTags: ['Azure Data Factory', 'GitLab CI/CD'], sortOrder: 2 },
      { theme: 'data-analytics', description: 'Learned SAP Data Sphere and S/4HANA, automating extraction into star schema models with Python.', skillTags: ['SAP Data Sphere', 'S/4HANA', 'Python', 'Star Schema'], sortOrder: 3 },
      { theme: 'data-analytics', description: 'Co-designed and built the SQL Server database that powers all Aldi GB and Ireland supply chain reporting. The ETL handles over twenty million new rows every day.', skillTags: ['SQL Server', 'ETL', 'Database Design'], sortOrder: 4 },
      { theme: 'data-analytics', description: 'Built the migration pipelines from SQL Server to Databricks under Unity Catalog governance, with medallion layers deployed through CI/CD.', skillTags: ['Data Migration', 'CI/CD'], sortOrder: 5 },
      { theme: 'data-analytics', description: 'Delivered supply chain insight across loss, forecast accuracy, and warehouse capacity. Used from senior leadership to store operators to shape purchasing and planning.', skillTags: ['Supply Chain Analytics', 'Data Visualisation'], sortOrder: 6 },
      { theme: 'change-management', description: 'Challenged the core design of the supply chain database, met resistance, gathered the evidence, and won the change. The conflict resolved with every relationship intact.', skillTags: ['Stakeholder Management', 'Evidence-Based Decision Making'], sortOrder: 7 },
      { theme: 'change-management', description: 'Designed and carried a demand-to-solution agile framework across a 300+ person supply chain department, winning buy-in face to face.', skillTags: ['Agile', 'Framework Design', 'Change Leadership'], sortOrder: 8 },
      { theme: 'operational', description: 'Presented a complex rota-planning report to senior leaders across distribution centres under hard questioning, and kept composure. Managers now use it daily.', skillTags: ['Stakeholder Presentation', 'Reporting'], sortOrder: 9 },
      { theme: 'operational', description: 'During the AHEAD system migration, built critical reporting to close information gaps when the department had nothing else to rely on.', skillTags: ['Crisis Reporting'], sortOrder: 10 },
      { theme: 'change-management', description: 'Delivered Databricks and SQL execution-plan training, and coached a colleague into forecasting analysis the team had never attempted.', skillTags: ['Training', 'Coaching', 'Knowledge Transfer'], sortOrder: 11 },
      { theme: 'change-management', description: 'Carried the team through a move from National Supply Chain to National Finance and Administration, and a shift from Agile to Waterfall.', skillTags: ['Team Leadership', 'Organisational Change'], sortOrder: 12 },
    ],
  },

  // ── 15: ERIKS ─────────────────────────────────────────────────────────────
  {
    title: 'Data Analyst',
    company: 'ERIKS Industrial Supply',
    employmentType: 'employed',
    startDate: '2023-01',
    endDate: '2023-12',
    summary: 'Modelling ERP data into business reporting.',
    sortOrder: 15,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'Built Power BI semantic models in Fabric for the first time.', skillTags: ['Power BI', 'Microsoft Fabric', 'Semantic Modelling'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Developed SQL Server data models sourced from ERP systems.', skillTags: ['SQL Server', 'ERP', 'Data Modelling'], sortOrder: 2 },
      { theme: 'data-analytics', description: 'Delivered dashboards tracking finance and warehouse operations.', skillTags: ['Dashboards', 'Finance Reporting'], sortOrder: 3 },
    ],
  },

  // ── 14: Selco ─────────────────────────────────────────────────────────────
  {
    title: 'Data Analyst',
    company: 'Selco Builders Warehouse',
    employmentType: 'employed',
    startDate: '2022-01',
    endDate: '2023-01',
    summary: 'Led the move from spreadsheet reporting to a proper Power BI practice.',
    sortOrder: 14,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'Stepped up from building reports to defining Power BI strategy and standards.', skillTags: ['Power BI', 'BI Strategy'], sortOrder: 1 },
      { theme: 'change-management', description: 'Led the complete Power BI migration from legacy Excel reporting.', skillTags: ['Migration', 'Power BI'], sortOrder: 2 },
      { theme: 'change-management', description: 'Set the design principles and development standards the whole team adopted.', skillTags: ['Standards Development', 'Best Practice'], sortOrder: 3 },
      { theme: 'change-management', description: 'Trained colleagues to bring them up to speed on Power BI best practice.', skillTags: ['Training', 'Knowledge Transfer'], sortOrder: 4 },
    ],
  },

  // ── 13: DWP ───────────────────────────────────────────────────────────────
  {
    title: 'Performance Analyst',
    company: 'DWP',
    employmentType: 'employed',
    startDate: '2021-02',
    endDate: '2022-01',
    summary: 'Performance reporting for leadership, where the priorities moved weekly.',
    sortOrder: 13,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'Sharpened Power Query on large datasets and DAX for performance dashboards.', skillTags: ['Power Query', 'DAX', 'Power BI'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Built a report that earned Group Director recognition and a rare financial reward. The visual style became the department standard.', skillTags: ['Reporting', 'Data Visualisation'], sortOrder: 2 },
      { theme: 'operational', description: 'Kept pace with reporting demands that shifted weekly with government mandates.', skillTags: ['Agile Delivery', 'Stakeholder Management'], sortOrder: 3 },
      { theme: 'operational', description: 'Earlier in the same period, coached 18 to 24 year olds on Universal Credit through their job search.', skillTags: ['Coaching', 'Public Sector'], sortOrder: 4 },
    ],
  },

  // ── 12: Wolfman Digital Media ─────────────────────────────────────────────
  {
    title: 'Freelance Marketer',
    company: 'Wolfman Digital Media',
    employmentType: 'self-employed',
    startDate: '2020-01',
    endDate: '2021-02',
    summary: 'A social media management package for small businesses.',
    sortOrder: 12,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Built out content production: photography, digital design, scheduling.', skillTags: ['Photography', 'Digital Design', 'Content Production'], sortOrder: 1 },
      { theme: 'operational', description: 'Ran the full service for small business clients end to end.', skillTags: ['Client Management', 'Social Media'], sortOrder: 2 },
    ],
  },

  // ── 11: Team UAV ──────────────────────────────────────────────────────────
  {
    title: 'Digital Content Producer',
    company: 'Team UAV',
    employmentType: 'employed',
    startDate: '2019-08',
    endDate: '2019-12',
    summary: 'Digital content for a drone services business.',
    sortOrder: 11,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Editing drone video and DSLR photography across the Adobe suite.', skillTags: ['Adobe Suite', 'Video Editing', 'Photography'], sortOrder: 1 },
      { theme: 'operational', description: 'Produced print and social marketing aimed at prospective drone clients.', skillTags: ['Marketing', 'Print Design'], sortOrder: 2 },
    ],
  },

  // ── 10: Big Dog Motors ────────────────────────────────────────────────────
  {
    title: 'eBay Business Owner',
    company: 'Big Dog Motors',
    employmentType: 'self-employed',
    startDate: '2015-11',
    endDate: '2019-07',
    summary: 'An eBay business in classic car spares, run on its numbers.',
    sortOrder: 10,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'Ran profit and loss and margin management on a real trading business.', skillTags: ['P&L Management', 'Margin Analysis'], sortOrder: 1 },
      { theme: 'operational', description: 'Sold roughly 6,700 units over 44 months at 31% net profit.', skillTags: ['eCommerce', 'Sales'], sortOrder: 2 },
      { theme: 'operational', description: 'Held eBay Top Rated Seller status throughout, at 99.8% positive feedback.', skillTags: ['Customer Service', 'Quality Standards'], sortOrder: 3 },
      { theme: 'data-analytics', description: 'Built performance reporting in Excel from PayPal, banking, and eBay feeds.', skillTags: ['Excel', 'Performance Reporting'], sortOrder: 4 },
    ],
  },

  // ── 09: D2C Direct ────────────────────────────────────────────────────────
  {
    title: 'Data Manager',
    company: 'D2C Direct Ltd',
    employmentType: 'employed',
    startDate: '2014-10',
    endDate: '2015-08',
    summary: 'Built the data spine for a sales agency.',
    sortOrder: 9,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'VBA in Excel and Access to automate the work.', skillTags: ['VBA', 'Excel', 'MS Access'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Designed and built the MS Access database holding all prospect and customer sales data.', skillTags: ['Database Design', 'MS Access'], sortOrder: 2 },
      { theme: 'operational', description: 'Designed and ran a commission-based incentive scheme for the sales team.', skillTags: ['Incentive Design', 'Sales Operations'], sortOrder: 3 },
    ],
  },

  // ── 08: myppe Recycling ───────────────────────────────────────────────────
  {
    title: 'Development Lead & Owner',
    company: 'myppe Recycling Ltd',
    employmentType: 'self-employed',
    startDate: '2013-04',
    endDate: '2014-09',
    summary: 'Started the business, ran the operation, reported the impact.',
    sortOrder: 8,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Learned to build and fund a business from a standing start.', skillTags: ['Entrepreneurship', 'Business Planning'], sortOrder: 1 },
      { theme: 'operational', description: 'Secured funding, designed the operation, and managed three staff.', skillTags: ['Fundraising', 'People Management'], sortOrder: 2 },
      { theme: 'operational', description: 'Held SLAs with large organisations and grew the client base across channels.', skillTags: ['SLA Management', 'Business Development'], sortOrder: 3 },
      { theme: 'data-analytics', description: 'Built environmental reporting clients used for ISO 14001 audits and Environment Agency submissions.', skillTags: ['Environmental Reporting', 'Compliance', 'ISO 14001'], sortOrder: 4 },
    ],
  },

  // ── 07: RWE npower — Business Project Manager ─────────────────────────────
  {
    title: 'Business Project Manager',
    company: 'RWE npower',
    employmentType: 'employed',
    startDate: '2007-04',
    endDate: '2013-03',
    summary: 'PRINCE2 project manager delivering business change across the retail business.',
    sortOrder: 7,
    isCurrent: false,
    achievements: [
      { theme: 'change-management', description: 'Qualified PRINCE2 Practitioner in 2008, APMP in 2013.', skillTags: ['PRINCE2', 'APMP', 'Project Management'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Learned investment appraisal and business case development at real scale.', skillTags: ['Investment Appraisal', 'Business Case Development'], sortOrder: 2 },
      { theme: 'change-management', description: 'Took projects through investment appraisal and approval with development costs up to £850k.', skillTags: ['Investment Governance', 'Budget Management'], sortOrder: 3 },
      { theme: 'change-management', description: 'Delivered the £840k Vulnerable Customer Identifier, a mandatory OFGEM change ranked a top five deliverable for 2008/9.', skillTags: ['Regulatory Change', 'OFGEM'], sortOrder: 4 },
      { theme: 'change-management', description: 'Delivered the £300k Bulk Change of Agent project, including a historic data cleanse.', skillTags: ['Data Cleanse', 'Change of Agent'], sortOrder: 5 },
      { theme: 'operational', description: 'Ran three major projects across three retail programmes in parallel, one with six work streams.', skillTags: ['Programme Management', 'Multi-Project Delivery'], sortOrder: 6 },
      { theme: 'operational', description: 'Held budget governance and financial control, reporting forecast against actual to programme boards.', skillTags: ['Financial Control', 'Board Reporting'], sortOrder: 7 },
    ],
  },

  // ── 06: RWE npower — Technical Manager ────────────────────────────────────
  {
    title: 'Technical Manager',
    company: 'RWE npower',
    employmentType: 'employed',
    startDate: '2004-09',
    endDate: '2007-04',
    summary: 'Business expert owning operational process and large-scale change.',
    sortOrder: 6,
    isCurrent: false,
    achievements: [
      { theme: 'change-management', description: 'Cut my teeth on change and process integration at scale.', skillTags: ['Process Integration', 'Change Management'], sortOrder: 1 },
      { theme: 'change-management', description: 'Managed the relocation of over 200 staff, systems, and processes in the Residential Gains Project.', skillTags: ['Staff Relocation', 'Systems Migration'], sortOrder: 2 },
      { theme: 'change-management', description: 'Ran a business process integration project across npower sites end to end.', skillTags: ['Business Process Integration'], sortOrder: 3 },
    ],
  },

  // ── 05: RWE npower — Technical Coordinator ────────────────────────────────
  {
    title: 'Technical Coordinator',
    company: 'RWE npower',
    employmentType: 'employed',
    startDate: '2002-11',
    endDate: '2004-09',
    summary: 'Where the reporting and data thread really starts.',
    sortOrder: 5,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'Started designing management reports and statistics in earnest.', skillTags: ['Report Design', 'Statistics'], sortOrder: 1 },
      { theme: 'data-analytics', description: 'Microsoft Access Expert, 2004.', skillTags: ['MS Access'], sortOrder: 2 },
      { theme: 'data-analytics', description: 'Designed reporting templates and statistics that let the operation be run on the numbers.', skillTags: ['Operational Reporting', 'KPI Design'], sortOrder: 3 },
      { theme: 'operational', description: 'Managed service providers against SLAs, including renewal renegotiations.', skillTags: ['SLA Management', 'Vendor Management'], sortOrder: 4 },
    ],
  },

  // ── 04: RWE npower — Systems Operator ─────────────────────────────────────
  {
    title: 'Systems Operator',
    company: 'RWE npower',
    employmentType: 'employed',
    startDate: '2001-12',
    endDate: '2002-11',
    summary: 'Contract capture and the first operational reporting.',
    sortOrder: 4,
    isCurrent: false,
    achievements: [
      { theme: 'data-analytics', description: 'First proper operational reporting, building KPI reports for managers.', skillTags: ['KPI Reporting', 'Operational Reporting'], sortOrder: 1 },
      { theme: 'operational', description: 'Ensured accurate, timely contract capture and consistently hit targets.', skillTags: ['Data Entry', 'Target Delivery'], sortOrder: 2 },
    ],
  },

  // ── 03: RWE npower — Clerical Assistant ───────────────────────────────────
  {
    title: 'Clerical Assistant',
    company: 'RWE npower',
    employmentType: 'employed',
    startDate: '2001-06',
    endDate: '2001-12',
    summary: 'The first rung at npower.',
    sortOrder: 3,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Validated contract information to keep data integrity across the customer journey.', skillTags: ['Data Validation', 'Data Integrity'], sortOrder: 1 },
    ],
  },

  // ── 02: James Paget Group ─────────────────────────────────────────────────
  {
    title: 'Logistics',
    company: 'James Paget Group',
    employmentType: 'employed',
    startDate: '1998-06',
    endDate: '2001-06',
    summary: 'Sales and logistics, delivering hydraulics to customers.',
    sortOrder: 2,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Early grounding in sales and customer delivery.', skillTags: ['Sales', 'Logistics', 'Customer Delivery'], sortOrder: 1 },
    ],
  },

  // ── 01: Amptronic Ltd ─────────────────────────────────────────────────────
  {
    title: 'Control Panel Wiring',
    company: 'Amptronic Ltd',
    employmentType: 'employed',
    startDate: '1997-06',
    endDate: '1998-06',
    summary: 'Where it started. Wiring control panels to schematics.',
    sortOrder: 1,
    isCurrent: false,
    achievements: [
      { theme: 'operational', description: 'Reading schematics and building to spec, hands on.', skillTags: ['Technical Drawing', 'Manufacturing'], sortOrder: 1 },
    ],
  },
]

// ── Seed function ───────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding career data...\n')

  for (const role of ROLES) {
    // Insert role
    const [inserted] = await db.insert(careerRoles).values({
      title: role.title,
      company: role.company,
      employmentType: role.employmentType,
      startDate: role.startDate,
      endDate: role.endDate,
      summary: role.summary,
      sortOrder: role.sortOrder,
      isCurrent: role.isCurrent,
    }).returning({ id: careerRoles.id })

    console.log(`  ✓ Role ${role.sortOrder.toString().padStart(2, '0')}: ${role.title} @ ${role.company} → ${inserted.id}`)

    // Insert achievements for this role
    if (role.achievements.length > 0) {
      await db.insert(careerAchievements).values(
        role.achievements.map(a => ({
          roleId: inserted.id,
          theme: a.theme,
          description: a.description,
          skillTags: a.skillTags,
          sortOrder: a.sortOrder,
        }))
      )
      console.log(`    └─ ${role.achievements.length} achievements`)
    }
  }

  // Count totals
  const totalAchievements = ROLES.reduce((sum, r) => sum + r.achievements.length, 0)
  console.log(`\n✅ Done: ${ROLES.length} roles, ${totalAchievements} achievements`)
}

seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
