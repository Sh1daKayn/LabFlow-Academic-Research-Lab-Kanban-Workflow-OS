import {
  ChecklistAcceptanceTemplate,
  DirectRequest,
  LabMember,
  LabResource,
  LabWorkspaceData,
  ProjectItem,
  TaskItem,
  VenuePreset,
  WeeklyTodoItem,
} from '@/types';
import { DEFAULT_STAGES } from '@/data/mockData';
import { generateInitialsAvatar } from '@/utils/avatar';
import { getWeekKey } from '@/utils/weeklyTodos';

function makeMember(
  id: string,
  nameEn: string,
  role: LabMember['role'],
  accessRole: LabMember['accessRole'],
  titleEn: string,
  email: string,
  preferredViews?: LabMember['preferredViews'],
  defaultView?: LabMember['defaultView']
): LabMember {
  return {
    id,
    nameEn,
    nameZh: nameEn,
    role,
    accessRole,
    titleEn,
    titleZh: titleEn,
    avatar: generateInitialsAvatar(nameEn, id),
    email,
    preferredViews,
    defaultView,
  };
}

/**
 * Builds the canonical CAB Lab Spring -> Fall 2026 workspace dataset derived from
 * CABLab_Deck1.pptx (Spring 2026) and CABLab_Deck_2026fall.pptx (Fall 2026).
 */
export function buildCabLabPresetWorkspace(weekKey = getWeekKey()): LabWorkspaceData {
  const now = new Date().toISOString();

  const members: LabMember[] = [
    makeMember(
      'member-trey',
      'Trey Malone',
      'PI',
      'ADMIN_PI',
      'Lab Director · Boehlje Chair in Managerial Economics',
      'trey.malone@cablab.edu',
      ['kanban', 'todos', 'requests', 'architecture', 'gantt', 'meeting'],
      'meeting'
    ),
    makeMember(
      'member-masie',
      'Masie',
      'SENIOR_PHD',
      'SYS_ADMIN',
      'Senior Research Project Manager · Coordination & Logistics',
      'masie@cablab.edu',
      ['kanban', 'todos', 'requests', 'architecture', 'gantt', 'meeting'],
      'architecture'
    ),
    makeMember(
      'member-iris',
      'Iris',
      'POSTDOC',
      'PROJECT_LEAD',
      'Postdoctoral Fellow · Deputy Lab Lead / Mentor',
      'iris@cablab.edu',
      ['kanban', 'todos', 'requests', 'architecture', 'meeting'],
      'kanban'
    ),
    makeMember(
      'member-martin',
      'Martin',
      'PHD_CANDIDATE',
      'PROJECT_LEAD',
      'Doctoral Student · Methods & Modeling Lead (Shared Resource)',
      'martin@cablab.edu',
      ['requests', 'kanban', 'todos'],
      'requests'
    ),
    makeMember(
      'member-asa',
      'Asa',
      'RA',
      'STUDENT_RA',
      'MS Student · Cluster 1 (Strategic Org & Supply Chain)',
      'asa@cablab.edu'
    ),
    makeMember(
      'member-jiawei',
      'Jiawei',
      'PHD_CANDIDATE',
      'STUDENT_RA',
      'Cluster 1 · Supply Chain Efficiency, Workflow & Optimization',
      'jiawei@cablab.edu'
    ),
    makeMember(
      'member-daniel',
      'Daniel',
      'RA',
      'STUDENT_RA',
      'Cluster 2 · Business Strategy & Dealer Value',
      'daniel@cablab.edu'
    ),
    makeMember(
      'member-madison',
      'Madison',
      'RA',
      'STUDENT_RA',
      'Cluster 2 · Sales Effectiveness (Cattle & Protein Markets)',
      'madison@cablab.edu'
    ),
    makeMember(
      'member-cassidy',
      'Cassidy',
      'RA',
      'STUDENT_RA',
      'Cluster 3 · Agronomy Double Major & Policy Translation',
      'cassidy@cablab.edu'
    ),
    makeMember(
      'member-kyra',
      'Kyra',
      'RA',
      'STUDENT_RA',
      'Cluster 3 · Policy, Beliefs & Farmer Outcomes',
      'kyra@cablab.edu'
    ),
  ];

  const memberMap = new Map(members.map((m) => [m.id, m]));
  const m = (id: string): LabMember => memberMap.get(id) || members[0];

  const projects: ProjectItem[] = [
    // Cluster 1: Strategic Organizational & Supply Chain Management
    {
      id: 'proj-cab-vuca',
      title: 'Strategy Under Uncertainty and Measuring VUCA',
      abstract:
        'Uses producer and industry data to study beliefs, uncertainty, and strategic response; translates abstract VUCA concepts (Bennett & Lemoine, 2014) into a structured empirical dataset.',
      researchQuestion:
        'How do agribusiness leaders make strategic decisions when the environment is volatile, uncertain, complex, and ambiguous?',
      sharedDataset: 'Producer & Industry Uncertainty Survey',
      handoffHistory: [
        {
          id: 'ho-vuca-sp26',
          term: 'Spring 2026',
          memberId: 'member-asa',
          memberName: 'Asa (MS)',
          roleLabel: 'Original Lead',
          phaseSummary:
            'Built Bennett & Lemoine (2014) VUCA measurement schema on producer/industry data',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-vuca-fa26',
          term: 'Fall 2026',
          memberId: 'member-asa',
          memberName: 'Asa (MS)',
          roleLabel: 'Continuing Lead',
          phaseSummary:
            'Running empirical models & aligning organizational adaptation framing under Cluster 1',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'PAPER',
      category: 'Cluster 1: Strategic Org & Supply Chain',
      categoryColor: '#6366f1',
      memberIds: ['member-asa', 'member-iris', 'member-trey'],
      targetVenue: 'AAEA / Agribusiness',
      tag: 'C1 · VUCA',
      submissionDeadline: '2026-12-18',
      status: 'DATA_EXP',
      leadAuthorId: 'member-asa',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-ag-service',
      title: 'Who Buys "Ag-as-a-Service"? Subscription & Data-Sharing Adoption',
      abstract:
        'Two-part empirical model (adoption yes/no -> number of programs used) identifying managerial segments and constraints predicting deeper subscription engagement (Vlachopoulou et al., 2021).',
      researchQuestion:
        'Which producers adopt subscription and data-sharing programs, and what predicts deeper engagement?',
      sharedDataset: 'Large Commercial Producer Survey',
      handoffHistory: [
        {
          id: 'ho-agsaas-sp26',
          term: 'Spring 2026',
          memberName: 'Rider / Ryder',
          roleLabel: 'Prior Lead (Spring 2026)',
          phaseSummary:
            'Estimated two-part subscription adoption model on Large Commercial Producer Survey',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-agsaas-fa26',
          term: 'Fall 2026',
          memberId: 'member-iris',
          memberName: 'Iris',
          roleLabel: 'Handoff Custodian (Needs Reassignment)',
          phaseSummary:
            'Auditing Stata/R replication code and pricing implications for manuscript wrap-up',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'PAPER',
      category: 'Cluster 1: Strategic Org & Supply Chain',
      categoryColor: '#6366f1',
      memberIds: ['member-iris', 'member-masie', 'member-trey'],
      targetVenue: 'Sustainability / AAEA',
      tag: 'C1 · AgSaaS',
      submissionDeadline: '2026-12-12',
      status: 'PI_REVIEW',
      leadAuthorId: 'member-iris',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-digital-gaps',
      title: 'Visualizing Digital Adoption Gaps Across Agri-Food Firms',
      abstract:
        'Creates a Choices-style infographic and accompanying short narrative translating Industry 4.0 agri-food adoption bottlenecks (ShalekBriski, Loy, & Malone SSRN 5338549) for managers and policymakers.',
      researchQuestion:
        'If digital tools promise efficiency, why does adoption remain fragmented across firms and roles?',
      sharedDataset: 'Agri-Food Industry 4.0 Adoption Dataset (SSRN 5338549)',
      handoffHistory: [
        {
          id: 'ho-dig-sp26',
          term: 'Spring 2026',
          memberName: 'Delaney',
          roleLabel: 'Visual Design & Storytelling Lead',
          phaseSummary:
            'Developed Choices-style infographic draft and uneven adoption narrative with Iris',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-dig-fa26',
          term: 'Fall 2026',
          memberId: 'member-iris',
          memberName: 'Iris',
          roleLabel: 'Editorial Lead',
          phaseSummary:
            'Finalizing analysis notes & short narrative for Choices submission',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'VERTICAL_PROJECT',
      partnerOrg: 'Choices Magazine / Extension Outreach',
      milestoneNode: 'Choices Infographic + Short Narrative Submission',
      category: 'Cluster 1: Strategic Org & Supply Chain',
      categoryColor: '#6366f1',
      memberIds: ['member-iris', 'member-trey'],
      targetVenue: 'Choices Magazine',
      tag: 'C1 · Choices',
      submissionDeadline: '2026-12-05',
      status: 'DRAFTING',
      leadAuthorId: 'member-iris',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-supply-chain',
      title: 'Agribusiness Supply Chain Workflow & Operations Optimization',
      abstract:
        'Fall 2026 Cluster 1 expansion examining coordination, workflow efficiency, and operational bottlenecks in agribusiness supply chains.',
      researchQuestion:
        'How can supply chain workflow design and coordination improve operational efficiency under uncertainty?',
      sharedDataset: 'Producer & Industry Uncertainty Survey',
      handoffHistory: [
        {
          id: 'ho-sc-fa26',
          term: 'Fall 2026',
          memberId: 'member-jiawei',
          memberName: 'Jiawei',
          roleLabel: 'Project Lead (New Fall 2026)',
          phaseSummary:
            'Early-semester research question framing & literature anchoring with Iris',
          status: 'ACTIVE',
        },
      ],
      inheritedFrom: [
        {
          id: 'inh-sc-vuca',
          parentProjectId: 'proj-cab-vuca',
          relationType: 'SPINOFF',
          fromTerm: 'Spring 2026',
          toTerm: 'Fall 2026',
          note: 'Fall 2026 Cluster 1 expansion spun off from Spring 2026 VUCA Producer Uncertainty dataset & framing',
        },
      ],
      workCategory: 'HORIZONTAL_PROJECT',
      partnerOrg: 'Agribusiness Supply Chain Stakeholders',
      milestoneNode: 'Early-Semester RQ Sign-off -> Mid-Semester Descriptive Figures',
      category: 'Cluster 1: Strategic Org & Supply Chain',
      categoryColor: '#6366f1',
      memberIds: ['member-jiawei', 'member-asa', 'member-iris', 'member-trey'],
      targetVenue: 'Cluster 1 Fall Track',
      tag: 'C1 · SupplyChain',
      submissionDeadline: '2026-12-20',
      status: 'IDEATION',
      leadAuthorId: 'member-jiawei',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },

    // Cluster 2: Sales & Marketing Strategy
    {
      id: 'proj-cab-retailer-misalignment',
      title: 'Retailer Value Propositions & Misinterpretation',
      abstract:
        'Compares producer-stated priorities against retailer-perceived values using Caplan (2001) economic cognition shortcuts to uncover where value propositions miss the mark.',
      researchQuestion:
        'Do retailers accurately understand producer priorities, or do sensemaking shortcuts lead to systematic misalignment?',
      sharedDataset: 'Producer-Retailer Value Alignment Survey',
      handoffHistory: [
        {
          id: 'ho-ret-sp26',
          term: 'Spring 2026',
          memberName: 'Emma',
          roleLabel: 'Original Lead (Spring 2026)',
          phaseSummary:
            'Framed Caplan (2001) sensemaking comparison between producer-stated and retailer-perceived values',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-ret-fa26',
          term: 'Fall 2026',
          memberId: 'member-daniel',
          memberName: 'Daniel',
          roleLabel: 'Continuing Lead (Fall 2026)',
          phaseSummary:
            'Took over project; quantifying misalignment magnitude & developing managerial implications',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'PAPER',
      category: 'Cluster 2: Sales & Marketing Strategy',
      categoryColor: '#06b6d4',
      memberIds: ['member-daniel', 'member-iris', 'member-trey'],
      targetVenue: 'Agribusiness / AJAE',
      tag: 'C2 · Retailer',
      submissionDeadline: '2026-12-15',
      status: 'DATA_EXP',
      leadAuthorId: 'member-daniel',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-wallet-share',
      title: 'Dealer Value, Trust, and Share of Wallet',
      abstract:
        'Links dealer value and trust perceptions to financing and purchasing behavior (Keiningham et al., 2003), clarifying when relational strength stops short of economic commitment.',
      researchQuestion:
        'When do strong producer-dealer relationships actually lead to a greater share of wallet, and when do they not?',
      sharedDataset: 'Agribusiness Dealer Trust & Financing Dataset',
      handoffHistory: [
        {
          id: 'ho-wal-sp26',
          term: 'Spring 2026',
          memberName: 'Gustavo (MS)',
          roleLabel: 'Prior Lead (Spring 2026)',
          phaseSummary:
            'Built producer-dealer share-of-wallet and financing empirical baseline',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-wal-fa26',
          term: 'Fall 2026',
          memberId: 'member-masie',
          memberName: 'Masie',
          roleLabel: 'PM Handoff Audit',
          phaseSummary:
            'Verifying clean dataset & assigning Fall Cluster 2 reviewer',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'HORIZONTAL_PROJECT',
      partnerOrg: 'Agribusiness Retail & Financing Partners',
      milestoneNode: 'Handoff Pack Verification & Industry Brief Decision',
      category: 'Cluster 2: Sales & Marketing Strategy',
      categoryColor: '#06b6d4',
      memberIds: ['member-masie', 'member-daniel', 'member-trey'],
      targetVenue: 'JSR / Agribusiness Brief',
      tag: 'C2 · WalletShare',
      submissionDeadline: '2026-12-10',
      status: 'PI_REVIEW',
      leadAuthorId: 'member-masie',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-localness',
      title: 'When "Local" Stops Being Enough',
      abstract:
        'Examines consumer tradeoffs between identity, quality, and experience in craft beverages (Farris, Malone, et al., 2019), showing when symbolic differentiation erodes without performance reinforcement.',
      researchQuestion:
        'At what point does "local" cease to function as a sufficient differentiator, and what replaces it?',
      sharedDataset: 'Craft Beverage Consumer Choice Dataset',
      handoffHistory: [
        {
          id: 'ho-loc-sp26',
          term: 'Spring 2026',
          memberName: 'Kaitlyn',
          roleLabel: 'Prior Lead (Spring 2026)',
          phaseSummary:
            'Completed saturation & category-blurring empirical analysis for craft beverages',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-loc-fa26',
          term: 'Fall 2026',
          memberId: 'member-iris',
          memberName: 'Iris',
          roleLabel: 'Submission Custodian',
          phaseSummary:
            'Packaging narrative & verifying manuscript target journal alignment',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'PAPER',
      category: 'Cluster 2: Sales & Marketing Strategy',
      categoryColor: '#06b6d4',
      memberIds: ['member-iris', 'member-trey'],
      targetVenue: 'Journal of Wine Economics / Food Policy',
      tag: 'C2 · Localness',
      submissionDeadline: '2026-12-14',
      status: 'REVISION',
      leadAuthorId: 'member-iris',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-protein-sales',
      title: 'Sales Effectiveness & Customer Purchasing in Cattle & Protein Markets',
      abstract:
        'Applied data-driven study of sales effectiveness and customer/farmer purchasing behavior across cattle and protein markets.',
      researchQuestion:
        'Which buyer signals and sales-rep behaviors drive purchasing commitments in cattle and protein markets?',
      sharedDataset: 'Cattle & Protein Purchasing Survey',
      handoffHistory: [
        {
          id: 'ho-prot-fa26',
          term: 'Fall 2026',
          memberId: 'member-madison',
          memberName: 'Madison',
          roleLabel: 'Project Lead (New Fall 2026)',
          phaseSummary:
            'Clarifying core sales effectiveness hypotheses & baseline customer segments',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'HORIZONTAL_PROJECT',
      partnerOrg: 'Cattle & Protein Industry Sales Partners',
      milestoneNode: 'Early-Semester RQ Definition -> Mid-Semester Descriptive Results',
      category: 'Cluster 2: Sales & Marketing Strategy',
      categoryColor: '#06b6d4',
      memberIds: ['member-madison', 'member-daniel', 'member-iris', 'member-trey'],
      targetVenue: 'Cluster 2 Fall Track',
      tag: 'C2 · ProteinSales',
      submissionDeadline: '2026-12-20',
      status: 'IDEATION',
      leadAuthorId: 'member-madison',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },

    // Cluster 3: Policy, Beliefs & Public Outcomes
    {
      id: 'proj-cab-sustainability-policy',
      title: 'Sustainability vs. Regenerative: Policy Meaning and Tradeoffs',
      abstract:
        'Compares how policymakers, industry leaders, and consumers rank profitability, soil health, yield, water use, and emissions, translating survey evidence into policy/advocacy takeaways (Malone & Golan, 2024).',
      researchQuestion:
        'When policymakers, industry leaders, and consumers use the same sustainability language, are they prioritizing the same outcomes?',
      sharedDataset: 'Multi-Stakeholder Sustainability & Regenerative Survey',
      handoffHistory: [
        {
          id: 'ho-sus-sp26',
          term: 'Spring 2026',
          memberId: 'member-kyra',
          memberName: 'Kyra',
          roleLabel: 'Founding Lead (Policy & Advocacy)',
          phaseSummary:
            'Initiated stakeholder ranking comparisons anchored in Malone & Golan (2024) Farm Foundation brief',
          status: 'CO_LEAD',
        },
        {
          id: 'ho-sus-fa26',
          term: 'Fall 2026',
          memberId: 'member-cassidy',
          memberName: 'Cassidy',
          roleLabel: 'Co-Lead (Agronomy Double Major)',
          phaseSummary:
            'Joined Kyra in Fall 2026 to integrate agronomic soil/yield tradeoffs for farmer-relevant translation',
          status: 'CO_LEAD',
        },
      ],
      workCategory: 'VERTICAL_PROJECT',
      partnerOrg: 'Farm Foundation / Agricultural Policy Stakeholders',
      milestoneNode: 'Cross-Stakeholder Ranking Figures & Policy Translation Brief',
      category: 'Cluster 3: Policy, Beliefs & Public Outcomes',
      categoryColor: '#10b981',
      memberIds: ['member-kyra', 'member-cassidy', 'member-iris', 'member-trey'],
      targetVenue: 'Farm Foundation / Policy Brief',
      tag: 'C3 · Policy',
      submissionDeadline: '2026-12-10',
      status: 'DRAFTING',
      leadAuthorId: 'member-kyra',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
    {
      id: 'proj-cab-growth-expectations',
      title: 'Farmer Growth Expectations Over Time',
      abstract:
        'Examines time-series patterns in producer growth expectations, asymmetric adjustment to positive vs. negative signals, and belief persistence (Wiklund, Davidsson, & Delmar, 2003).',
      researchQuestion:
        'How do large commercial producers form, revise, and sustain expectations about farm growth under changing economic and policy conditions?',
      sharedDataset: 'Large Commercial Producer Survey',
      handoffHistory: [
        {
          id: 'ho-gro-sp26',
          term: 'Spring 2026',
          memberName: 'Chenyu Pan (MS)',
          roleLabel: 'Prior Lead (Spring 2026)',
          phaseSummary:
            'Tested asymmetric expectation revisions across Large Commercial Producer waves',
          status: 'HANDED_OFF',
        },
        {
          id: 'ho-gro-fa26',
          term: 'Fall 2026',
          memberId: 'member-masie',
          memberName: 'Masie',
          roleLabel: 'PM Handoff Audit',
          phaseSummary:
            'Archiving wave codebook & scheduling Cluster 3 continuation assignment',
          status: 'ACTIVE',
        },
      ],
      workCategory: 'PAPER',
      category: 'Cluster 3: Policy, Beliefs & Public Outcomes',
      categoryColor: '#10b981',
      memberIds: ['member-masie', 'member-iris', 'member-trey'],
      targetVenue: 'ETP / Applied Econ',
      tag: 'C3 · Expectations',
      submissionDeadline: '2026-12-16',
      status: 'DATA_EXP',
      leadAuthorId: 'member-masie',
      piId: 'member-trey',
      assets: {},
      visibility: 'PUBLIC',
    },
  ];

  const tasks: TaskItem[] = [
    {
      id: 'task-cab-1',
      title: 'Mid-Semester Gate: VUCA Regression Figures & Robustness Checks',
      description:
        'Finalize descriptive results and figures mapping Bennett & Lemoine (2014) VUCA dimensions across producer uncertainty dataset; coordinate Stata robustness check with Martin.',
      workCategory: 'PAPER',
      stage: 'DATA_EXP',
      projectId: 'proj-cab-vuca',
      projectTag: 'C1 · VUCA',
      targetVenue: 'AAEA / Agribusiness',
      startDate: '2026-10-15',
      deadline: '2026-11-28',
      progress: 65,
      leadAuthor: m('member-asa'),
      pi: m('member-trey'),
      priority: 'HIGH',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Cluster 1', 'VUCA', 'Mid-Semester'],
      checklist: [
        { id: 'cab-c1', text: 'Verify descriptive summary table on producer uncertainty survey', done: true },
        { id: 'cab-c2', text: 'Schedule Martin sanity check on VUCA regression specification', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-2',
      title: 'Early-Semester Gate: Supply Chain RQ & Core Dataset Alignment',
      description:
        'Define clear 1-sentence research question and identify empirical workflow datasets in Cluster 1 coordination meetings with Iris and Asa.',
      workCategory: 'HORIZONTAL_PROJECT',
      partnerOrg: 'Agribusiness Supply Chain Stakeholders',
      milestoneNode: 'Early-Semester RQ Gate',
      stage: 'IDEATION',
      projectId: 'proj-cab-supply-chain',
      projectTag: 'C1 · SupplyChain',
      targetVenue: 'Cluster 1 Fall Track',
      startDate: '2026-11-01',
      deadline: '2026-11-25',
      progress: 40,
      leadAuthor: m('member-jiawei'),
      pi: m('member-trey'),
      priority: 'HIGH',
      assets: {},
      isBlocked: false,
      order: 1,
      tags: ['Cluster 1', 'Supply Chain', 'Early-Semester'],
      checklist: [
        { id: 'cab-c3', text: 'Draft 1-page problem framing memo (Question-driven)', done: true },
        { id: 'cab-c4', text: 'Confirm empirical dataset access with Masie & Iris', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-3',
      title: 'Cross-Term Handoff Audit: Ag-as-a-Service & Digital Gaps (Spring -> Fall)',
      description:
        'Ensure Ryder (Ag-as-a-Service two-part model) and Delaney (Choices infographic) scripts, datasets, and narrative drafts are fully packaged for Trey review.',
      workCategory: 'PAPER',
      stage: 'PI_REVIEW',
      projectId: 'proj-cab-ag-service',
      projectTag: 'C1 · AgSaaS',
      targetVenue: 'Sustainability / Choices',
      startDate: '2026-10-20',
      deadline: '2026-12-04',
      progress: 80,
      leadAuthor: m('member-iris'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Handoff Audit', 'Cluster 1'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-4',
      title: 'Emma -> Daniel Handoff: Retailer Value Misalignment Empirical Update',
      description:
        'Re-run producer-stated vs. retailer-perceived priority comparisons (Caplan 2001 framework) and draft managerial implications section.',
      workCategory: 'PAPER',
      stage: 'DATA_EXP',
      projectId: 'proj-cab-retailer-misalignment',
      projectTag: 'C2 · Retailer',
      targetVenue: 'Agribusiness / AJAE',
      startDate: '2026-10-10',
      deadline: '2026-12-01',
      progress: 55,
      leadAuthor: m('member-daniel'),
      pi: m('member-trey'),
      priority: 'URGENT',
      assets: {},
      isBlocked: true,
      blocker: {
        category: 'ALGO_CONVERGENCE',
        details:
          'Need robustness check on retailer cognitive shortcut weights when producer sample weights vary across regions.',
        tried: 'Re-estimated unweighted OLS & logit specifications in Stata using Emma Spring 2026 script.',
        escalatedTo: 'Martin',
        escalatedToId: 'member-martin',
        reportedAt: now,
      },
      order: 2,
      tags: ['Cross-Term Handoff', 'Cluster 2'],
      checklist: [
        { id: 'cab-c5', text: 'Audit Emma Spring 2026 dataset codebook', done: true },
        { id: 'cab-c6', text: 'Validate weighted perception gap table with Martin', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-5',
      title: 'Early-Semester Gate: Cattle & Protein Sales Effectiveness Framing',
      description:
        'Specify sales effectiveness hypothesis and map farmer purchasing variables before Mid-Semester descriptive statistics milestone.',
      workCategory: 'HORIZONTAL_PROJECT',
      partnerOrg: 'Cattle & Protein Industry Sales Partners',
      milestoneNode: 'Early-Semester RQ Approval',
      stage: 'IDEATION',
      projectId: 'proj-cab-protein-sales',
      projectTag: 'C2 · ProteinSales',
      targetVenue: 'Cluster 2 Fall Track',
      startDate: '2026-11-01',
      deadline: '2026-11-29',
      progress: 35,
      leadAuthor: m('member-madison'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 2,
      tags: ['Cluster 2', 'Protein Markets'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-6',
      title: 'Joint Co-Lead Draft: Sustainability vs. Regenerative Policy Brief',
      description:
        'Combine Kyra stakeholder ranking analysis with Cassidy agronomic interpretation across profitability, soil health, yield, water use, and emissions.',
      workCategory: 'VERTICAL_PROJECT',
      partnerOrg: 'Farm Foundation',
      milestoneNode: 'Late-Semester External Draft',
      stage: 'DRAFTING',
      projectId: 'proj-cab-sustainability-policy',
      projectTag: 'C3 · Policy',
      targetVenue: 'Farm Foundation / Policy Brief',
      startDate: '2026-10-18',
      deadline: '2026-12-08',
      progress: 70,
      leadAuthor: m('member-kyra'),
      pi: m('member-trey'),
      priority: 'HIGH',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Co-Lead', 'Cluster 3', 'Policy'],
      checklist: [
        { id: 'cab-c7', text: 'Align soil health & yield metrics between Kyra & Cassidy', done: true },
        { id: 'cab-c8', text: 'Generate cross-stakeholder ranking chart for Iris review', done: false },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-7',
      title: 'Agronomic Interpretation Section for Sustainability vs. Regenerative',
      description:
        'Translate soil health, yield, and water-use tradeoffs into farmer-relevant advocacy language for Cluster 3 joint deliverable.',
      workCategory: 'VERTICAL_PROJECT',
      partnerOrg: 'Farm Foundation',
      milestoneNode: 'Agronomy Translation Pass',
      stage: 'DRAFTING',
      projectId: 'proj-cab-sustainability-policy',
      projectTag: 'C3 · Policy',
      targetVenue: 'Farm Foundation / Policy Brief',
      startDate: '2026-10-25',
      deadline: '2026-12-08',
      progress: 60,
      leadAuthor: m('member-cassidy'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 1,
      tags: ['Co-Lead', 'Agronomy', 'Cluster 3'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-8',
      title: 'Lab-Wide Cross-Term Asset Audit (Gustavo, Kaitlyn & Chenyu Pan Tracks)',
      description:
        'Verify clean data snapshots, Stata/R/Python scripts, and next-step handoff memos for Spring 2026 projects awaiting Fall reassignment or submission.',
      workCategory: 'PAPER',
      stage: 'PI_REVIEW',
      projectId: 'proj-cab-wallet-share',
      projectTag: 'C2 · WalletShare',
      targetVenue: 'Lab Coordination Audit',
      startDate: '2026-11-02',
      deadline: '2026-11-30',
      progress: 50,
      leadAuthor: m('member-masie'),
      pi: m('member-trey'),
      priority: 'HIGH',
      assets: {},
      isBlocked: false,
      order: 1,
      tags: ['PM Coordination', 'Handoff Pack'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-9',
      title: 'Choices Infographic & Uneven Adoption Short Narrative Pack',
      description:
        'Finalize Delaney’s Choices-style infographic draft and analysis notes into a cohesive extension submission narrative.',
      workCategory: 'VERTICAL_PROJECT',
      partnerOrg: 'Choices Magazine / Extension Outreach',
      milestoneNode: 'Choices Infographic + Short Narrative Submission',
      stage: 'DRAFTING',
      projectId: 'proj-cab-digital-gaps',
      projectTag: 'C1 · Choices',
      targetVenue: 'Choices Magazine',
      startDate: '2026-10-20',
      deadline: '2026-12-05',
      progress: 75,
      leadAuthor: m('member-iris'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Cluster 1', 'Choices', 'Infographic'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-10',
      title: 'Package Kaitlyn Localness Narrative & Verify Journal Target',
      description:
        'Consolidate Spring 2026 saturation and category-blurring craft beverage empirical tables and polish narrative framing for Journal of Wine Economics / Food Policy.',
      workCategory: 'PAPER',
      stage: 'REVISION',
      projectId: 'proj-cab-localness',
      projectTag: 'C2 · Localness',
      targetVenue: 'Journal of Wine Economics / Food Policy',
      startDate: '2026-10-18',
      deadline: '2026-12-14',
      progress: 80,
      leadAuthor: m('member-iris'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Cluster 2', 'Handoff', 'Craft Beverage'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'task-cab-11',
      title: 'Archive Growth Expectations Wave Codebook & Assign Fall Lead',
      description:
        'Package Chenyu Pan’s Spring 2026 asymmetric expectation revision scripts and Large Commercial Producer Survey codebook for Cluster 3 continuation.',
      workCategory: 'PAPER',
      stage: 'DATA_EXP',
      projectId: 'proj-cab-growth-expectations',
      projectTag: 'C3 · Expectations',
      targetVenue: 'ETP / Applied Econ',
      startDate: '2026-10-22',
      deadline: '2026-12-16',
      progress: 55,
      leadAuthor: m('member-masie'),
      pi: m('member-trey'),
      priority: 'MEDIUM',
      assets: {},
      isBlocked: false,
      order: 0,
      tags: ['Cluster 3', 'Expectations', 'Handoff Pack'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const resources: LabResource[] = [
    {
      id: 'res-cab-survey',
      nameEn: 'Large Commercial Producer Survey (Shared Dataset Vault)',
      nameZh: 'Large Commercial Producer Survey (Shared Dataset Vault)',
      type: 'SERVER',
      specs: 'Shared dataset across Cluster 1 (Ag-as-a-Service) & Cluster 3 (Growth Expectations)',
      status: 'IDLE',
    },
    {
      id: 'res-cab-methods',
      nameEn: 'Stata / R / Python Econometric Office Hours (Martin)',
      nameZh: 'Stata / R / Python Econometric Office Hours (Martin)',
      type: 'EQUIPMENT',
      specs: 'Shared lab technical support (debugging, robustness, interpretation — not project owner)',
      status: 'IDLE',
    },
  ];

  const weeklyTodos: WeeklyTodoItem[] = [
    {
      id: 'cab-todo-1',
      memberId: 'member-daniel',
      weekKey,
      title: 'Finalize Caplan (2001) perception-gap regression table from Emma handoff dataset',
      done: false,
      priority: 'URGENT',
      projectId: 'proj-cab-retailer-misalignment',
      taskId: 'task-cab-4',
      acceptanceCriteria: 'Clean Stata log verified with Martin + 1 summary slide for Cluster 2 meeting',
      acceptanceStatus: 'PENDING',
      assignedById: 'member-masie',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cab-todo-2',
      memberId: 'member-kyra',
      weekKey,
      title: 'Integrate Cassidy agronomic tradeoff edits into Farm Foundation draft',
      done: true,
      priority: 'HIGH',
      projectId: 'proj-cab-sustainability-policy',
      taskId: 'task-cab-6',
      acceptanceCriteria: '5-metric stakeholder ranking figure reviewed by Iris',
      acceptanceStatus: 'SUBMITTED',
      assignedById: 'member-iris',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cab-todo-3',
      memberId: 'member-masie',
      weekKey,
      title: 'Collect Fall 2026 handoff audit checklist for Spring 2026 alumni projects',
      done: false,
      priority: 'HIGH',
      projectId: 'proj-cab-wallet-share',
      taskId: 'task-cab-8',
      acceptanceCriteria: 'Confirmed dataset + script location for Ryder, Gustavo, Kaitlyn, Chenyu Pan',
      acceptanceStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const directRequests: DirectRequest[] = [
    {
      id: 'cab-req-1',
      kind: 'BLOCKER_HELP',
      title: 'Stata weighted robustness check on Retailer Misalignment (Emma -> Daniel handoff)',
      content:
        'Martin, could you look over the regional weighting command in Emma Spring 2026 do-file before Friday Cluster 2 meeting?',
      senderId: 'member-daniel',
      recipientId: 'member-martin',
      visibility: 'PUBLIC',
      status: 'OPEN',
      workCategory: 'PAPER',
      projectId: 'proj-cab-retailer-misalignment',
      taskId: 'task-cab-4',
      dueDate: '2026-11-22',
      replies: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cab-req-2',
      kind: 'PROJECT_SYNC',
      title: 'Cross-Term Handoff Status for Spring 2026 Alumni Projects',
      content:
        'Hi Trey, I logged handoff records for Emma->Daniel and Kyra->Cassidy&Kyra, and flagged Ryder/Gustavo/Kaitlyn/Chenyu projects for disposition at our next leadership sync.',
      senderId: 'member-masie',
      recipientId: 'member-trey',
      visibility: 'PRIVATE',
      status: 'OPEN',
      workCategory: 'HORIZONTAL_PROJECT',
      projectId: 'proj-cab-wallet-share',
      taskId: 'task-cab-8',
      replies: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'cab-req-3',
      kind: 'CHAT',
      title: '1:1 Sensemaking: Aligning Cluster 1 Supply Chain Scope',
      content:
        'Hi Iris, before Cluster 1 meeting I wanted to clarify whether my supply chain framing should share the Producer & Industry Uncertainty Survey with Asa.',
      senderId: 'member-jiawei',
      recipientId: 'member-iris',
      visibility: 'PRIVATE',
      status: 'REPLIED',
      workCategory: 'HORIZONTAL_PROJECT',
      projectId: 'proj-cab-supply-chain',
      taskId: 'task-cab-2',
      replies: [
        {
          id: 'cab-rep-1',
          authorId: 'member-iris',
          content:
            'Great instinct—bring your 1-sentence RQ to our 30-min Cluster 1 meeting and we will align shared variables with Asa.',
          createdAt: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const checklistTemplates: ChecklistAcceptanceTemplate[] = [
    {
      id: 'tpl-cab-semester-gates',
      name: 'CAB Lab: Semester 3-Phase Progress Gates',
      category: 'Semester Cadence',
      description:
        'Standard milestone cadence from Deck Slide 3: Early RQ -> Mid Descriptive Figures -> Late Outputs',
      items: [
        {
          text: '[Early Semester] Lock 1-sentence Research Question & core literature anchor',
          acceptanceCriteria: 'Signed off by Trey/Iris in Cluster meeting; zero unmanaged ambiguity',
          priority: 'URGENT',
        },
        {
          text: '[Mid-Semester] Generate clean descriptive tables & core figures + Martin robustness check',
          acceptanceCriteria: 'Reproducible Stata/R/Python script produces publication-grade figures',
          priority: 'HIGH',
        },
        {
          text: '[Late Semester] Complete full draft / policy brief / infographic & external submission prep',
          acceptanceCriteria: 'Reviewed by Iris & Trey with coherent narrative ready for external audience',
          priority: 'HIGH',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tpl-cab-cross-term-handoff',
      name: 'CAB Lab: Cross-Term Project Handoff Audit',
      category: 'Handoff SOP',
      description:
        'Mandatory end-of-term / transition checklist so multi-semester projects never lose data or context',
      items: [
        {
          text: 'Document Shared Dataset location & variable codebook snapshot',
          acceptanceCriteria: 'New lead can load exact cleaned sample independently',
          priority: 'URGENT',
        },
        {
          text: 'Verify reproducible Stata / R / Python pipeline from raw data to latest tables',
          acceptanceCriteria: 'Runs end-to-end with zero broken local paths',
          priority: 'HIGH',
        },
        {
          text: 'Log Handoff Timeline entry (Term, Role, Phase Summary, What Remains Fuzzy)',
          acceptanceCriteria: 'Prior contributor credited & next contributor first step recorded on Project card',
          priority: 'HIGH',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'tpl-cab-weekly-cluster',
      name: 'CAB Lab: Weekly Cluster Workhorse Check-in',
      category: 'Weekly Meeting',
      description: '3-question agenda for weekly 30-45 min Cluster meetings',
      items: [
        {
          text: '1. What moved since last week? (Link completed figure, table, or draft snippet)',
          acceptanceCriteria: 'Concrete observable artifact updated before Cluster meeting',
          priority: 'HIGH',
        },
        {
          text: '2. Identify ONE bottleneck or decision point (route coding bugs to Martin 1:1)',
          acceptanceCriteria: 'Either unblocked in Cluster meeting or routed via 1-on-1 request',
          priority: 'MEDIUM',
        },
        {
          text: '3. Lock next concrete steps with explicit single owner',
          acceptanceCriteria: 'Every follow-up item added to Weekly To-Do with clear assignee',
          priority: 'MEDIUM',
        },
      ],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const venues: VenuePreset[] = [
    {
      id: 'venue-aaea',
      name: 'AAEA Annual Meeting',
      tag: 'AAEA',
      defaultLeadId: 'member-masie',
      milestones: [
        { nameEn: 'Early-Semester RQ & Dataset Lock', nameZh: '研究问题与数据集确认', offsetDays: 45, stageId: 'IDEATION' },
        { nameEn: 'Mid-Semester Descriptive Figures', nameZh: '描述统计与核心图表', offsetDays: 28, stageId: 'DATA_EXP' },
        { nameEn: 'Iris & Trey Internal Framing Review', nameZh: 'Iris 与导师审阅', offsetDays: 14, stageId: 'PI_REVIEW' },
        { nameEn: 'Submission / Abstract Final Pack', nameZh: '最终投稿打包', offsetDays: 3, stageId: 'REVISION' },
      ],
    },
    {
      id: 'venue-choices',
      name: 'Choices Magazine / Policy Brief',
      tag: 'Choices',
      defaultLeadId: 'member-iris',
      milestones: [
        { nameEn: 'Infographic Prototype & Metric Extraction', nameZh: '信息图原型与指标提取', offsetDays: 30, stageId: 'DATA_EXP' },
        { nameEn: 'Short Narrative Translation Draft', nameZh: '政策简报初稿', offsetDays: 15, stageId: 'DRAFTING' },
        { nameEn: 'Director Framing Sign-Off', nameZh: '导师最终定稿审阅', offsetDays: 5, stageId: 'PI_REVIEW' },
      ],
    },
  ];

  return {
    stages: DEFAULT_STAGES,
    tasks,
    projects,
    members,
    venues,
    resources,
    weeklyTodos,
    directRequests,
    allowPeerAcceptance: false,
    checklistTemplates,
  };
}

/**
 * Serializes the CAB Lab 2026 preset into a LabFlow JSON backup packet ready for download or restore.
 */
export function buildCabLabImportPackJson(): string {
  const workspace = buildCabLabPresetWorkspace();
  return JSON.stringify(
    {
      version: 4,
      presetName: 'CAB Lab Spring -> Fall 2026 Coordination & Cross-Term Handoffs',
      exportedAt: new Date().toISOString(),
      ...workspace,
    },
    null,
    2
  );
}
