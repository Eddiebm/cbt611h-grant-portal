import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabase'
import type { ChangeStatus, DBChangeDecision, DBDocumentNote } from './supabase'

interface SuggestedChange {
  id: string; section: string; location: string; action: 'insert' | 'replace' | 'add'
  removeText?: string; insertText: string; rationale: string; scoreImpact: string
  status: ChangeStatus; decidedBy?: string; decidedAt?: string
}
interface GrantDocument {
  id: string; name: string; filename: string
  category: 'research_strategy' | 'biosketch' | 'administrative' | 'letters' | 'supporting'
  nihSection?: string; status: 'original' | 'modified' | 'review_needed'
  changes: SuggestedChange[]; notes: string; notesUpdatedBy?: string
  lastModified: string; priority: 'critical' | 'high' | 'normal'
}
interface ActivityEntry { member: string; action: string; created_at: string }

const BASE_DOCUMENTS: GrantDocument[] = [
  { id: 'research_strategy', name: 'Research Strategy — Full Fast-Track + Specific Aims', filename: 'Full_Fast_Track___Specific_Aims___Phase_I_ans_2_Plan_CHDQ_040326__2_.docx', category: 'research_strategy', nihSection: 'Research Strategy (12 page limit)', status: 'review_needed', priority: 'critical', notes: '', lastModified: new Date().toISOString(), changes: [
    { id: 'rs-01', section: 'Significance', location: 'End of DCLK1 therapeutic index paragraph — after "...expression in normal adult tissues is limited."', action: 'insert', insertText: 'While pan-DCLK1 protein is detectable in adult brain, heart, liver, and GI epithelium by immunohistochemistry, the therapeutically relevant question is whether the non-kinase extracellular binding domain (NKEBD) — the C-terminal epitope unique to isoforms 2 and 4 and the precise target of CBT-611H — is surface-exposed in normal human tissues at levels sufficient for CAR-T engagement. Surface biotinylation studies confirm that the isoform 2/4 NKEBD is extracellular in tumor cells; no published study has characterized its surface density in normal human tissue or microphysiologic models. This distinction between total DCLK1 protein abundance and isoform-specific surface accessibility is central to CBT-611H\'s therapeutic index and is directly addressed by Aim 3.', rationale: 'Preempts reviewer challenge on NKEBD off-tumor risk.', scoreImpact: 'Significance 1.5 → maintained; Approach risk reduced', status: 'pending' },
    { id: 'rs-02', section: 'Innovation', location: 'After existing organ-on-a-chip innovation paragraph — as new bullet/paragraph', action: 'insert', insertText: 'First-ever isoform-specific surface characterization of DCLK1 in normal human tissue. Published DCLK1 expression data in normal tissues — brain, kidney, liver, GI epithelium — reflect total protein abundance across all isoforms, measured by IHC and northern blotting, without distinguishing surface-exposed isoforms 2 and 4 from the intracellular long isoforms that predominate in adult neurons and hepatocytes. The NKEBD, the extracellular epitope targeted by CBT-611H, is structurally restricted to isoforms 2 and 4 and has not been quantified on the surface of any normal human cell type in any published study. Aim 3 will generate the first isoform-resolved, surface-specific DCLK1 dataset in human normal tissue — conducted in commercially available microphysiologic chip models representing the six organs of greatest clinical relevance for CAR-T off-tumor risk.', rationale: 'Converts chip safety screen from platform claim to data-generation claim.', scoreImpact: 'Innovation 1.6 → 1.5', status: 'pending' },
    { id: 'rs-03', section: 'Innovation', location: 'End of Innovation section — before Impact summary sentence', action: 'insert', insertText: 'The CBT-611H program operates under an exclusive global license to OUHSC\'s DCLK1 intellectual property portfolio, anchored by U.S. Patent 12,084,514 B2. This patent coverage, combined with COARE\'s 18+ years of DCLK1 biology and the CSC-restricted NKEBD targeting strategy, creates an IP moat that is difficult to design around and that positions CBT-611H as the foundational DCLK1-targeted immunotherapy asset across multiple solid tumor indications. Co-development discussions for a companion diagnostic (CDx) targeting DCLK1 expression by IHC are ongoing with Leica Biosystems and Ventana/Roche.', rationale: 'IP moat and CDx strategy currently only in Commercialization Plan — must appear in Innovation section.', scoreImpact: 'Innovation 1.6 → 1.5', status: 'pending' },
    { id: 'rs-04', section: 'Aim 3 Rationale', location: 'Replace existing Aim 3 Rationale paragraph starting "DCLK1 isoforms 2 and 4 are upregulated..."', action: 'replace', removeText: 'DCLK1 isoforms 2 and 4 are upregulated in several solid tumors but may also be expressed at low levels in select normal tissues, including the nervous system. CAR-T therapies directed against antigens with neural or other normal-tissue expression can cause on-target, off-tumor toxicity.', insertText: 'DCLK1 isoforms 2 and 4 are distinguished from isoforms 1 and 3 by a unique C-terminal non-kinase extracellular binding domain (NKEBD) that is surface-exposed in tumor cells, as confirmed by surface biotinylation. CBT-611H is directed against this NKEBD, not against pan-DCLK1 protein. While total DCLK1 protein is detectable in adult brain, renal tubules, and GI tuft cells, the isoform responsible for that expression in normal tissues is predominantly the long alpha isoform (isoform 1), which lacks the NKEBD and is intracellularly oriented. No published study has quantified NKEBD surface density in normal human neural, hepatic, renal, cardiac, pulmonary, or GI tissue. This gap is material: CAR-T on-target, off-tumor toxicity is a function of surface antigen density, not total protein abundance, and the two can diverge substantially across isoforms.', rationale: 'Closes the most exploitable reviewer gap in Approach.', scoreImpact: 'Approach 2.2 → 1.9', status: 'pending' },
    { id: 'rs-05', section: 'Aim 1 Experimental Design', location: 'After first mention of 4-hour carboplatin pre-treatment interval in Group 4 description', action: 'insert', insertText: 'The pre-treatment interval is based on carboplatin\'s pharmacokinetic profile and published data on platinum-induced TME remodeling. Carboplatin reaches peak cytotoxic exposure within 1-2 hours of administration. By 4 hours post-carboplatin, platinum-induced immunogenic cell death signals — including calreticulin surface exposure and HMGB1 release — are ascending toward their 3-6 hour peak, while T-cell viability is preserved at clinically relevant carboplatin concentrations. This timing will be formally validated in Aim 1 by comparing simultaneous vs. 4-hour vs. 24-hour sequential dosing on cytotoxicity and T-cell activation endpoints.', rationale: 'Every reviewer with pharmacology training will flag the absence of timing rationale.', scoreImpact: 'Approach 2.2 → 2.0', status: 'pending' },
    { id: 'rs-06', section: 'Approach — Environment', location: 'New subsection at END of Approach section, immediately before Scientific Rigor paragraph. Title: "Environment and Resources."', action: 'insert', insertText: 'Environment and Resources. The proposed studies will be conducted across a purpose-built multi-site infrastructure. At OUHSC, Dr. Houchen\'s laboratory has direct access to the Flow and Image Cytometry Laboratory, the Advanced Immunohistochemistry and Morphology Core, the IVIS Small Animal Molecular Imaging System, and the Molecular Biology Proteomics Facility. COARE Holdings operates an independent laboratory at the Presbyterian Health Foundation Research Complex (OU Research Parkway, Oklahoma City). Aim 3 organ-on-a-chip safety studies will be conducted under subcontract to MIMETAS (OrganoPlate). Aim 4 manufacturing and Aim 5 IND-enabling toxicology will be executed by ProMab Biotechnologies and Southern Research (Birmingham, AL) respectively. Southern Research is an FDA GLP-compliant, AAALAC-accredited CRO with over 80 years of preclinical experience. All proposed in vivo studies at Southern Research will be conducted under IACUC-approved protocols established prior to study initiation.', rationale: 'NIH scores Environment as a distinct criterion. No environment paragraph exists in the current Research Strategy.', scoreImpact: 'Environment 1.8 → 1.5', status: 'pending' },
    { id: 'rs-07', section: 'Aim 3 Experimental Design', location: 'Before the sentence describing chip conditions or vendor selection in Aim 3', action: 'insert', insertText: 'To establish programmatic competency in organ-on-a-chip hepatotoxicity assessment, COARE Holdings completed a hepatotoxicity study on human Quad-Culture Liver-Chips (Study Report SRV-0165, September 2024) evaluating a DCLK1-targeting siRNA construct at 50, 100, and 200 nM. SiDCLK1 produced no morphologic evidence of hepatotoxicity at any tested dose across a 7-day treatment window, with albumin secretion and ALT profiles indistinguishable from vehicle control. Aim 3 will employ MIMETAS OrganoPlate systems for the expanded multiplex organ-panel safety screen, selected for their throughput advantage enabling parallel assessment across six tissue types in a single experimental run.', rationale: 'Cites SRV-0165 Emulate study as preliminary chip data, confirms MIMETAS platform rationale, and bridges vendor switch.', scoreImpact: 'Approach feasibility +; Innovation preliminary data anchor', status: 'pending' },
    { id: 'rs-08', section: 'Aim 2 Rationale', location: 'After "PDOs will be generated from ascites obtained from platinum-resistant HGSOC patients under an IRB-approved protocol."', action: 'insert', insertText: 'This protocol is currently active and accruing at the OU Health Stephenson Cancer Center under the clinical leadership of Dr. Debra Richardson, Section Chief of Gynecologic Oncology, whose program manages 22 active oncology trials and treats a sufficient volume of platinum-resistant HGSOC patients annually to support the target accrual of 20-25 independent PDO lines within the Year 1 study window.', rationale: 'Confirms IRB status and accrual feasibility.', scoreImpact: 'Approach Aim 2 feasibility concern resolved', status: 'pending' },
    { id: 'rs-09', section: 'All Figures', location: 'Every figure legend currently showing Word alt-text (e.g., "A close-up of a graph Description automatically generated")', action: 'replace', removeText: 'All placeholder alt-text figure legends', insertText: 'FIGURE 1: DCLK1 expression correlates with poor prognosis in HGSOC. Kaplan-Meier overall survival curves stratified by DCLK1 expression level in platinum-treated HGSOC patients.\n\nFIGURE 2: DCLK1 inhibition re-sensitizes HGSOC spheroids to cisplatin. CellTiter-Glo viability assay, OVCAR8-CPR spheroids, cisplatin ± DCLK1 siRNA vs. scrambled control.\n\nFIGURE 3: DCLK1 knockdown suppresses EMT and metastatic phenotypes. Migration/invasion assay, OVCAR8-CPR cells, DCLK1 siRNA vs. scrambled control.\n\nFIGURE 4: First-generation DCLK1 CAR-T cells inhibit CRC xenograft growth. Tumor volume, NSG mice bearing DCLK1+ CRC cells, DCLK1-CAR-T vs. mock CAR-T/vehicle.\n\nFIGURE 5: CBT-611H demonstrates dose-dependent DCLK1-specific cytotoxicity. Real-time IncuCyte cytotoxicity, CBT-611H vs. mock CAR-T, OVCAR8-CPR and DCLK1-KO cells, E:T 1:1/5:1/10:1.', rationale: 'Placeholder figure legends signal draft quality to reviewers.', scoreImpact: 'First impression; Approach clarity', status: 'pending' },
  ]},
  { id: 'commercialization', name: 'Commercialization Plan — CBT-611H', filename: 'CBT611H_Commercialization_Plan_v2__2_.docx', category: 'administrative', nihSection: 'Commercialization Plan', status: 'original', priority: 'normal', notes: 'Strong document. CDx strategy, IP moat language, and carboplatin-as-primer reframe are more precise than Research Strategy. Key language should migrate TO the Research Strategy Innovation section (changes rs-02, rs-03).', lastModified: new Date().toISOString(), changes: [] },
  { id: 'houchen_bio', name: 'Biosketch — Courtney W. Houchen, MD (Lead PI)', filename: 'Houchen_Biosketch_082525_for_STTR_grant.docx', category: 'biosketch', nihSection: 'Biosketch — Lead PI', status: 'original', priority: 'normal', notes: 'Strong. 18+ yr DCLK1 IP originator. George Lynn Cross Research Professor, Regents Professor.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'hannafon_bio', name: 'Biosketch — Bethany N. Hannafon, PhD (Co-I)', filename: 'Hannafon_Biosketch_DCLK1_STTR.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-Investigator', status: 'review_needed', priority: 'high', notes: 'Active F09 NIH study section reviewer — credential must be elevated. DoD PI + OCRA PI for DCLK1 ovarian cancer.', lastModified: new Date().toISOString(), changes: [
    { id: 'han-01', section: 'Personal Statement', location: 'Add to Personal Statement — first or second paragraph', action: 'insert', insertText: 'I currently serve as an active reviewer on the F09 Oncology Study Section at the National Institutes of Health, a role that provides direct insight into how NIH study sections evaluate STTR Fast-Track applications in the oncology space and ensures that the CBT-611H application is calibrated to the highest standards of NIH review.', rationale: 'F09 reviewer status is the most underutilized credential in the package.', scoreImpact: 'Investigator 1.6 → 1.5', status: 'pending' }
  ]},
  { id: 'richardson_bio', name: 'Biosketch — Debra L. Richardson, MD (Co-I)', filename: 'Richardson_Biosketch_STTR_2025.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-Investigator', status: 'original', priority: 'normal', notes: 'National PI REJOICE & UPLIFT trials. 22 active trials at Stephenson Cancer Center. SGO Board of Directors.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'posey_bio', name: 'Biosketch — Avery D. Posey Jr., PhD (Consultant)', filename: 'Posey_-_NIH_Biosketch_090225__1_.pdf', category: 'biosketch', nihSection: 'Biosketch — Consultant', status: 'original', priority: 'normal', notes: 'Carl June lab training. TnMUC1-CAR-T Phase I PI. Parker et al. Cell 2020 — CD19 CAR-T neurotoxicity via brain mural cells. Relevant to Aim 3 brain chip rationale.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'vita_bio', name: 'Biosketch — Vita Golubovskaya, PhD (ProMab)', filename: 'Vita_Biosketch_STTR_2025.pdf', category: 'biosketch', nihSection: 'Biosketch — Investigator (Subcontract)', status: 'original', priority: 'normal', notes: 'Designed the CBT-611H construct. VP R&D ProMab. 100+ CAR-T constructs to clinic.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'qu_bio', name: 'Biosketch — Dongfeng Qu, PhD (Co-I)', filename: 'Biosketch_Qu_082825_STTR.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-Investigator', status: 'original', priority: 'normal', notes: 'DCLK1 mAb and CAR-T originator at OUHSC. Professor of Research.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'dogra_bio', name: 'Biosketch — Samrita Dogra, PhD (Co-I)', filename: 'Dogra_NIH_Bio.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-Investigator', status: 'review_needed', priority: 'high', notes: 'DoD CDMRP PI. Cancer Letters 2023 first author on DCLK1 ovarian chemoresistance. Must write figure legends for Figures 1-3.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'deoli_bio', name: 'Biosketch — Eliseu De Oliveira, PhD (Co-PI)', filename: 'COARE_2024_STTR_-_BIOSKETCH_Eliseu_De_Oliveira__1___2_.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-PI (COARE)', status: 'original', priority: 'normal', notes: 'Active DCLK1 SBIR PI (5R44CA224472). Medicinal chemistry and CRO coordination expertise.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'adhikari_bio', name: 'Biosketch — Laura J. Adhikari, MD (Co-I)', filename: 'Adhikari_Laura_Biosketch_STTR_2025.pdf', category: 'biosketch', nihSection: 'Biosketch — Co-Investigator', status: 'original', priority: 'normal', notes: 'Gynecologic pathologist and biomarker expert. CDx strategy for DCLK1 IHC companion diagnostic.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'los_posey', name: 'Letter of Support — Avery D. Posey Jr., PhD (Penn)', filename: 'Consultant_Letter_of_Support_Posey__1_.pdf', category: 'letters', nihSection: 'Letters of Support', status: 'original', priority: 'normal', notes: 'RECEIVED. Penn Medicine letterhead. 20-25 hrs/yr Phase I, 30-40 hrs/yr Phase II.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'los_southern', name: 'Letter of Support — Southern Research (Scott Hayes, PhD)', filename: 'Letter_of_Support_for_COARE_Holdings__1_.pdf', category: 'letters', nihSection: 'Letters of Support', status: 'original', priority: 'normal', notes: 'RECEIVED. GLP compliance, AAALAC accreditation, A/BSL-1/2/3, 204,000 sq ft campus confirmed.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'los_vita', name: 'Letter of Support — Vita Golubovskaya, PhD (ProMab)', filename: 'Vita_LOS_STTR.docx', category: 'letters', nihSection: 'Letters of Support', status: 'original', priority: 'normal', notes: 'RECEIVED. Confirms ProMab designed CBT-611H construct. Aims 4+5 scope confirmed.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'los_toxicology', name: 'Letter — Toxicology / ProMab Scope (Aims 4+5)', filename: 'Letter_toxicology_STTR__1_.docx', category: 'letters', nihSection: 'Letters of Support', status: 'original', priority: 'normal', notes: 'RECEIVED. GMP LVV production, CAR-T process development, GLP toxicology, NOAEL, full IND study reports confirmed.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'los_mimetas', name: 'Letter of Support — MIMETAS (Morgan) — PENDING', filename: 'MIMETAS_LOS_PENDING.pdf', category: 'letters', nihSection: 'Letters of Support', status: 'review_needed', priority: 'critical', notes: 'NOT YET RECEIVED — HIGHEST PRIORITY. Morgan at MIMETAS confirmed willingness. OrganoPlate subcontract, HGSOC co-culture model, brain/gut negative controls, 5-month turnaround.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'vertebrate', name: 'Vertebrate Animals Section', filename: 'STTR_Vertebrate_Animals_Phase_I_CHDQ_final_090225.docx', category: 'administrative', nihSection: 'Vertebrate Animals', status: 'original', priority: 'normal', notes: 'Clean and compliant. Female NSG mice 6-8 weeks, IP OVCAR8-CPR Luc+, carboplatin 50 mg/kg. Power calc n=20/group.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'facilities', name: 'Facilities & Other Resources', filename: 'COARE_Facilities_CAR-T__1_.docx', category: 'administrative', nihSection: 'Facilities & Other Resources', status: 'review_needed', priority: 'high', notes: 'Good content but missing IACUC statement.', lastModified: new Date().toISOString(), changes: [
    { id: 'fac-01', section: 'Southern Research paragraph', location: 'At the end of the Southern Research description paragraph', action: 'insert', insertText: 'All proposed in vivo studies will be conducted under Southern Research IACUC-approved protocols, with protocol numbers to be confirmed and provided in the final application package prior to submission.', rationale: 'No document in the package states that an active IACUC protocol exists.', scoreImpact: 'Environment/Approach regulatory compliance', status: 'pending' }
  ]},
  { id: 'equipment', name: 'Equipment List', filename: 'COARE_Equipment_CAR-T1__1_.pdf', category: 'administrative', nihSection: 'Equipment', status: 'original', priority: 'normal', notes: 'TECAN M200 Pro, TECAN Hydroflex, IVIS shared, ultracentrifuges. No revisions required.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'multi_pi', name: 'Multiple PI Leadership Plan', filename: 'Multiple_PI_Leadership_Plan_010325.docx', category: 'administrative', nihSection: 'Multiple PI Leadership Plan', status: 'review_needed', priority: 'high', notes: 'Houchen (Lead PI/OUHSC) and De Oliveira (Co-PI/COARE). Hannafon F09 reviewer status must be added.', lastModified: new Date().toISOString(), changes: [
    { id: 'mpi-01', section: 'Scientific Team', location: 'Near the top of the coordination plan — as standalone paragraph', action: 'insert', insertText: 'The research team includes Dr. Bethany Hannafon (OUHSC), who serves as an active reviewer on the F09 Oncology Study Section at the National Institutes of Health. Dr. Hannafon\'s direct study section experience provides the CBT-611H program with an intimate understanding of how NIH reviewers evaluate STTR Fast-Track applications in the oncology space, and her participation as Co-Investigator ensures that all scientific presentations, preliminary data structures, and application logic are calibrated to NIH reviewer expectations at the highest level.', rationale: 'F09 reviewer status must appear where reviewers will see it.', scoreImpact: 'Investigator 1.6 → 1.5', status: 'pending' }
  ]},
  { id: 'data_mgmt', name: 'Data Management Plan', filename: 'Data_Management_Plan_010325.docx', category: 'administrative', nihSection: 'Data Management Plan', status: 'original', priority: 'normal', notes: 'Covers imaging, human PDO data, organoid sharing, FAIR principles. No revisions required.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'resource_sharing', name: 'Resource Sharing Plan', filename: 'Resource_Sharing_Plan_010325.docx', category: 'administrative', nihSection: 'Resource Sharing Plan', status: 'original', priority: 'normal', notes: 'CBT-611H IP protected under COARE license. PDOs available to academic researchers under MTA. Compliant.', lastModified: new Date().toISOString(), changes: [] },
  { id: 'liver_chip', name: 'Liver Toxicity Study Report — SRV-0165 (Emulate)', filename: 'SRV-0165_-_COARE_-_Liver_Toxicity_-_Study_Report_-_V1_0_Shared.pptx', category: 'supporting', nihSection: 'Preliminary Data (Supporting)', status: 'original', priority: 'high', notes: 'KEY PRELIMINARY DATA. siDCLK1 at 50/100/200 nM — no hepatotoxicity on Emulate Quad-Culture Liver-Chip through 7 days. Cite as SRV-0165 in Aim 3 rationale.', lastModified: new Date().toISOString(), changes: [] },
]

const SCORE_DATA = { current: 1.9, projected: 1.5, criteria: [{ name: 'Significance', current: 1.5, target: 1.5 }, { name: 'Innovation', current: 1.6, target: 1.5 }, { name: 'Approach', current: 2.2, target: 1.8 }, { name: 'Investigators', current: 1.6, target: 1.5 }, { name: 'Environment', current: 1.8, target: 1.5 }] }
const TEAM_MEMBERS = ['Eddie', 'Courtney', 'Bethany', 'Samrita', 'Eliseu', 'Debra', 'Vita', 'Dongfeng']
const CATEGORIES = [{ id: 'research_strategy', label: 'Research Strategy', icon: '📄' }, { id: 'biosketch', label: 'Biosketches', icon: '👤' }, { id: 'letters', label: 'Letters of Support', icon: '✉️' }, { id: 'administrative', label: 'Administrative', icon: '📋' }, { id: 'supporting', label: 'Supporting Data', icon: '🔬' }]

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(null)
  const [documents, setDocuments] = useState<GrantDocument[]>(BASE_DOCUMENTS)
  const [activity, setActivity] = useState<ActivityEntry[]>([])
  const [activeCategory, setActiveCategory] = useState('all')
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const applyDecisions = useCallback((decisions: DBChangeDecision[]) => {
    setDocuments(prev => prev.map(doc => {
      const updatedChanges = doc.changes.map(change => {
        const d = decisions.find(x => x.id === change.id && x.doc_id === doc.id)
        return d ? { ...change, status: d.status, decidedBy: d.decided_by, decidedAt: d.decided_at } : change
      })
      const hasAccepted = updatedChanges.some(c => c.status === 'accepted')
      const allResolved = doc.changes.length > 0 && updatedChanges.every(c => c.status !== 'pending')
      return { ...doc, changes: updatedChanges, status: hasAccepted ? 'modified' : allResolved ? 'original' : doc.status }
    }))
  }, [])

  const applyNotes = useCallback((notes: DBDocumentNote[]) => {
    setDocuments(prev => prev.map(doc => {
      const n = notes.find(x => x.doc_id === doc.id)
      return n ? { ...doc, notes: n.note, notesUpdatedBy: n.updated_by } : doc
    }))
  }, [])

  useEffect(() => {
    if (!currentUser) return
    setLoading(true)
    Promise.all([
      supabase.from('change_decisions').select('*'),
      supabase.from('document_notes').select('*'),
      supabase.from('team_activity').select('*').order('created_at', { ascending: false }).limit(50)
    ]).then(([{ data: d }, { data: n }, { data: a }]) => {
      if (d) applyDecisions(d)
      if (n) applyNotes(n)
      if (a) setActivity(a as ActivityEntry[])
      setLoading(false)
    })
  }, [currentUser, applyDecisions, applyNotes])

  useEffect(() => {
    if (!currentUser) return
    if (channelRef.current) supabase.removeChannel(channelRef.current)
    const ch = supabase.channel('portal-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'change_decisions' }, async () => {
        const { data } = await supabase.from('change_decisions').select('*')
        if (data) applyDecisions(data)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'document_notes' }, async () => {
        const { data } = await supabase.from('document_notes').select('*')
        if (data) applyNotes(data)
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'team_activity' }, (p) => {
        setActivity(prev => [p.new as ActivityEntry, ...prev].slice(0, 50))
      })
      .subscribe()
    channelRef.current = ch
    return () => { supabase.removeChannel(ch) }
  }, [currentUser, applyDecisions, applyNotes])

  const updateChange = useCallback(async (docId: string, changeId: string, status: ChangeStatus) => {
    if (!currentUser) return
    setSyncing(true)
    const doc = documents.find(d => d.id === docId)
    const change = doc?.changes.find(c => c.id === changeId)
    await supabase.from('change_decisions').upsert({ id: changeId, doc_id: docId, status, decided_by: currentUser, decided_at: new Date().toISOString() }, { onConflict: 'id,doc_id' })
    if (doc && change) await supabase.from('team_activity').insert({ member: currentUser, action: `${status} "${change.section}" in ${doc.name.split('—')[0].trim()}` })
    setSyncing(false)
  }, [currentUser, documents])

  const updateNote = useCallback(async (docId: string, note: string) => {
    if (!currentUser) return
    setSyncing(true)
    await supabase.from('document_notes').upsert({ doc_id: docId, note, updated_by: currentUser, updated_at: new Date().toISOString() }, { onConflict: 'doc_id' })
    setSyncing(false)
  }, [currentUser])

  if (!currentUser) return <LoginScreen onLogin={setCurrentUser} />

  const selectedDoc = selectedDocId ? documents.find(d => d.id === selectedDocId) || null : null
  const totalPending = documents.reduce((s, d) => s + d.changes.filter(c => c.status === 'pending').length, 0)
  const totalAccepted = documents.reduce((s, d) => s + d.changes.filter(c => c.status === 'accepted').length, 0)
  const criticalDocs = documents.filter(d => d.priority === 'critical' && d.status === 'review_needed')
  const filteredDocs = documents.filter(d => (activeCategory === 'all' || d.category === activeCategory) && (!searchQuery || d.name.toLowerCase().includes(searchQuery.toLowerCase())))

  if (selectedDoc) return <DocumentView doc={selectedDoc} currentUser={currentUser} syncing={syncing} onBack={() => setSelectedDocId(null)} onUpdateChange={updateChange} onUpdateNote={updateNote} />

  return (
    <div style={{ fontFamily: "'Georgia','Times New Roman',serif", background: '#0f1419', minHeight: '100vh', color: '#e8e0d0' }}>
      <div style={{ background: 'linear-gradient(135deg,#0f1419 0%,#1a2530 100%)', borderBottom: '1px solid #2a3a4a', padding: '20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', maxWidth: 1400, margin: '0 auto' }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#1D9E75', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'monospace' }}>COARE HOLDINGS — NIH STTR FAST-TRACK</div>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: '#f0e8d8', letterSpacing: '-0.5px' }}>CBT-611H Grant Portal</h1>
            <div style={{ fontSize: 13, color: '#8a9ab0', marginTop: 4 }}>DCLK1-Targeted CAR-T + Carboplatin · Platinum-Resistant HGSOC</div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center', background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '12px 20px' }}>
              <div style={{ fontSize: 10, color: '#8a9ab0', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Impact Score</div>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div><div style={{ fontSize: 30, fontWeight: 700, color: '#BA7517', lineHeight: 1 }}>{SCORE_DATA.current}</div><div style={{ fontSize: 10, color: '#8a9ab0' }}>current</div></div>
                <div style={{ color: '#3a4a5a' }}>→</div>
                <div><div style={{ fontSize: 30, fontWeight: 700, color: '#1D9E75', lineHeight: 1 }}>{SCORE_DATA.projected}</div><div style={{ fontSize: 10, color: '#1D9E75' }}>target</div></div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#1D9E75', fontFamily: 'monospace', fontWeight: 600 }}>● {currentUser}</div>
              {(syncing || loading) && <div style={{ fontSize: 11, color: '#BA7517', fontFamily: 'monospace' }}>{syncing ? 'syncing...' : 'loading...'}</div>}
              <button onClick={() => setCurrentUser(null)} style={{ fontSize: 11, background: 'transparent', border: 'none', color: '#5a6a7a', cursor: 'pointer', fontFamily: 'Georgia,serif', marginTop: 4 }}>switch user</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 24 }}>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
            {[{ label: 'Total Documents', value: documents.length, color: '#4a8fb0' }, { label: 'Pending Changes', value: totalPending, color: '#BA7517', alert: totalPending > 0 }, { label: 'Accepted Changes', value: totalAccepted, color: '#1D9E75' }, { label: 'Critical Items', value: criticalDocs.length, color: '#c0392b', alert: criticalDocs.length > 0 }].map(s => (
              <div key={s.label} style={{ background: s.alert ? 'rgba(192,57,43,0.1)' : '#1a2530', border: `1px solid ${s.alert ? '#c0392b44' : '#2a3a4a'}`, borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#8a9ab0', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '16px 20px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8a9ab0', textTransform: 'uppercase', marginBottom: 12, fontFamily: 'monospace' }}>NIH Review Criteria</div>
            <div style={{ display: 'flex', gap: 16 }}>
              {SCORE_DATA.criteria.map(c => (
                <div key={c.name} style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#8a9ab0', marginBottom: 4 }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 20, fontWeight: 700, color: '#BA7517' }}>{c.current}</span>
                    <span style={{ fontSize: 11, color: '#5a6a7a' }}>→</span>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1D9E75' }}>{c.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {criticalDocs.length > 0 && <div style={{ background: 'rgba(192,57,43,0.12)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 10, padding: '10px 16px', marginBottom: 16 }}><span style={{ fontSize: 13, color: '#e07060' }}>⚠ <strong>Critical:</strong> {criticalDocs.map(d => d.name).join(' · ')}</span></div>}

          <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            {[{ id: 'all', label: 'All' }, ...CATEGORIES].map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} style={{ padding: '6px 14px', background: activeCategory === cat.id ? '#1D9E75' : 'transparent', border: `1px solid ${activeCategory === cat.id ? '#1D9E75' : '#2a3a4a'}`, borderRadius: 8, color: activeCategory === cat.id ? '#fff' : '#8a9ab0', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>{cat.label}</button>
            ))}
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..." style={{ marginLeft: 'auto', padding: '6px 12px', background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 8, color: '#e8e0d0', fontSize: 13, outline: 'none', fontFamily: 'Georgia,serif', width: 160 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 12 }}>
            {filteredDocs.map(doc => {
              const pending = doc.changes.filter(c => c.status === 'pending').length
              const accepted = doc.changes.filter(c => c.status === 'accepted').length
              const isCrit = doc.priority === 'critical' && doc.status === 'review_needed'
              const ext = doc.filename.split('.').pop()?.toUpperCase() || 'DOC'
              const extColors: Record<string,string> = { DOCX: '#2980b9', PDF: '#c0392b', PPTX: '#d35400' }
              const statusColors: Record<string,string> = { original: '#1D9E75', modified: '#4a8fb0', review_needed: '#BA7517' }
              const statusLabels: Record<string,string> = { original: 'Clean', modified: 'Modified', review_needed: 'Needs Review' }
              return (
                <div key={doc.id} onClick={() => setSelectedDocId(doc.id)} style={{ background: '#1a2530', border: `1px solid ${isCrit ? '#c0392b44' : '#2a3a4a'}`, borderRadius: 12, padding: 16, cursor: 'pointer', transition: 'border-color 0.15s', position: 'relative', overflow: 'hidden' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#1D9E75')} onMouseLeave={e => (e.currentTarget.style.borderColor = isCrit ? '#c0392b44' : '#2a3a4a')}>
                  {isCrit && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: '#c0392b' }} />}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ background: extColors[ext]||'#3a4a5a', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace' }}>{ext}</span>
                      <span style={{ fontSize: 10, color: statusColors[doc.status], fontWeight: 600, fontFamily: 'monospace' }}>{statusLabels[doc.status]}</span>
                    </div>
                    {doc.priority !== 'normal' && <span style={{ fontSize: 9, color: doc.priority === 'critical' ? '#c0392b' : '#BA7517', border: `1px solid ${doc.priority === 'critical' ? '#c0392b44' : '#BA751744'}`, borderRadius: 4, padding: '2px 6px', fontFamily: 'monospace' }}>{doc.priority.toUpperCase()}</span>}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#f0e8d8', marginBottom: 4, lineHeight: 1.3 }}>{doc.name}</div>
                  {doc.nihSection && <div style={{ fontSize: 11, color: '#5a7a9a', marginBottom: 6, fontFamily: 'monospace' }}>{doc.nihSection}</div>}
                  {doc.changes.length > 0 && <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {pending > 0 && <span style={{ fontSize: 11, background: 'rgba(186,117,23,0.15)', color: '#BA7517', borderRadius: 6, padding: '2px 8px' }}>{pending} pending</span>}
                    {accepted > 0 && <span style={{ fontSize: 11, background: 'rgba(29,158,117,0.15)', color: '#1D9E75', borderRadius: 6, padding: '2px 8px' }}>{accepted} accepted</span>}
                  </div>}
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '16px', position: 'sticky', top: 24 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8a9ab0', textTransform: 'uppercase', marginBottom: 14, fontFamily: 'monospace' }}>Team Activity</div>
            {activity.length === 0
              ? <div style={{ fontSize: 12, color: '#4a5a6a', fontStyle: 'italic' }}>No activity yet.</div>
              : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 580, overflowY: 'auto' }}>
                  {activity.map((a, i) => (
                    <div key={i} style={{ borderBottom: '1px solid #1a2a3a', paddingBottom: 8 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: '#1D9E75', fontWeight: 600 }}>{a.member}</span>
                        <span style={{ fontSize: 10, color: '#4a5a6a', fontFamily: 'monospace' }}>{a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.4 }}>{a.action}</div>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }: { onLogin: (name: string) => void }) {
  return (
    <div style={{ fontFamily: "'Georgia',serif", background: '#0f1419', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 16, padding: '40px 48px', maxWidth: 460, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, letterSpacing: '0.2em', color: '#1D9E75', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'monospace' }}>COARE HOLDINGS</div>
        <h1 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: '#f0e8d8' }}>CBT-611H Grant Portal</h1>
        <p style={{ color: '#8a9ab0', fontSize: 13, margin: '0 0 28px' }}>Select your name to continue</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {TEAM_MEMBERS.map(name => (
            <button key={name} onClick={() => onLogin(name)} style={{ padding: '12px', background: '#0f1419', border: '1px solid #2a3a4a', borderRadius: 10, color: '#c0b8a8', fontSize: 14, cursor: 'pointer', fontFamily: 'Georgia,serif', transition: 'all 0.15s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#1D9E75'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a3a4a'; e.currentTarget.style.color = '#c0b8a8' }}>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function DocumentView({ doc, currentUser, syncing, onBack, onUpdateChange, onUpdateNote }: { doc: GrantDocument; currentUser: string; syncing: boolean; onBack: () => void; onUpdateChange: (d: string, c: string, s: ChangeStatus) => void; onUpdateNote: (d: string, n: string) => void }) {
  const [noteText, setNoteText] = useState(doc.notes)
  const [editingNote, setEditingNote] = useState(false)
  const [activeChangeId, setActiveChangeId] = useState<string | null>(doc.changes[0]?.id || null)
  const activeChange = doc.changes.find(c => c.id === activeChangeId)
  useEffect(() => { setNoteText(doc.notes) }, [doc.notes])
  const statusColors: Record<string,string> = { pending: '#BA7517', accepted: '#1D9E75', rejected: '#c0392b' }
  const actionColors: Record<string,string> = { insert: '#2980b9', replace: '#BA7517', add: '#1D9E75' }

  return (
    <div style={{ fontFamily: "'Georgia',serif", background: '#0f1419', minHeight: '100vh', color: '#e8e0d0' }}>
      <div style={{ background: '#1a2530', borderBottom: '1px solid #2a3a4a', padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={onBack} style={{ background: 'transparent', border: '1px solid #2a3a4a', borderRadius: 8, color: '#8a9ab0', padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontFamily: 'Georgia,serif' }}>← Dashboard</button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 17, color: '#f0e8d8', fontWeight: 600 }}>{doc.name}</h2>
          <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'monospace' }}>{doc.filename} · {doc.nihSection}</div>
        </div>
        <div style={{ fontSize: 12, color: '#1D9E75', fontFamily: 'monospace' }}>{currentUser}{syncing ? ' · syncing...' : ''}</div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 32px', display: 'grid', gridTemplateColumns: doc.changes.length > 0 ? '240px 1fr' : '1fr', gap: 24 }}>
        {doc.changes.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8a9ab0', textTransform: 'uppercase', marginBottom: 4, fontFamily: 'monospace' }}>Changes ({doc.changes.length})</div>
            {doc.changes.map(change => (
              <div key={change.id} onClick={() => setActiveChangeId(change.id)} style={{ background: activeChangeId === change.id ? '#253545' : '#1a2530', border: `1px solid ${activeChangeId === change.id ? '#1D9E75' : '#2a3a4a'}`, borderRadius: 10, padding: '10px 12px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: '#5a8fb0', fontFamily: 'monospace', fontWeight: 600 }}>{change.section}</span>
                  <span style={{ fontSize: 10, color: statusColors[change.status], fontFamily: 'monospace' }}>{change.status}</span>
                </div>
                <div style={{ fontSize: 11, color: '#c0b8a8', lineHeight: 1.4 }}>{change.location.slice(0, 55)}...</div>
                {change.decidedBy && <div style={{ fontSize: 10, color: '#4a6a5a', marginTop: 3 }}>by {change.decidedBy}</div>}
                <div style={{ fontSize: 11, color: '#1D9E75', marginTop: 2 }}>{change.scoreImpact}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: '0.15em', color: '#8a9ab0', textTransform: 'uppercase', fontFamily: 'monospace' }}>Team Notes {doc.notesUpdatedBy && <span style={{ color: '#4a6a5a', textTransform: 'none', letterSpacing: 0 }}>· last by {doc.notesUpdatedBy}</span>}</div>
              {!editingNote
                ? <button onClick={() => setEditingNote(true)} style={{ fontSize: 12, background: 'transparent', border: '1px solid #2a3a4a', borderRadius: 6, color: '#8a9ab0', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Edit</button>
                : <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => { onUpdateNote(doc.id, noteText); setEditingNote(false) }} style={{ fontSize: 12, background: '#1D9E75', border: 'none', borderRadius: 6, color: '#fff', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Save</button>
                    <button onClick={() => { setNoteText(doc.notes); setEditingNote(false) }} style={{ fontSize: 12, background: 'transparent', border: '1px solid #2a3a4a', borderRadius: 6, color: '#8a9ab0', padding: '4px 10px', cursor: 'pointer', fontFamily: 'Georgia,serif' }}>Cancel</button>
                  </div>
              }
            </div>
            {editingNote
              ? <textarea value={noteText} onChange={e => setNoteText(e.target.value)} style={{ width: '100%', minHeight: 80, background: '#0f1419', border: '1px solid #2a3a4a', borderRadius: 8, color: '#e8e0d0', fontSize: 13, padding: 10, resize: 'vertical', outline: 'none', fontFamily: 'Georgia,serif', boxSizing: 'border-box' }} />
              : <div style={{ fontSize: 13, color: doc.notes ? '#c0b8a8' : '#4a5a6a', lineHeight: 1.6, fontStyle: doc.notes ? 'normal' : 'italic' }}>{doc.notes || 'No team notes yet.'}</div>
            }
          </div>

          {activeChange && (
            <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 10, background: actionColors[activeChange.action], color: '#fff', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace', fontWeight: 700 }}>{activeChange.action.toUpperCase()}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#f0e8d8' }}>{activeChange.section}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['accepted','rejected','pending'] as ChangeStatus[]).map(s => (
                    <button key={s} onClick={() => onUpdateChange(doc.id, activeChange.id, s)}
                      style={{ padding: '7px 16px', background: activeChange.status === s ? (s==='accepted'?'#1D9E75':s==='rejected'?'#c0392b':'#3a4a5a') : 'transparent', border: `1px solid ${activeChange.status===s?(s==='accepted'?'#1D9E75':s==='rejected'?'#c0392b':'#3a4a5a'):'#2a3a4a'}`, borderRadius: 8, color: activeChange.status===s?'#fff':'#8a9ab0', fontSize: 12, cursor: 'pointer', fontFamily: 'Georgia,serif' }}>
                      {s.charAt(0).toUpperCase()+s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: '#5a7a9a', fontFamily: 'monospace', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Location in Document</div>
                <div style={{ background: '#0f1419', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#a0b8c8', lineHeight: 1.5, borderLeft: '2px solid #4a8fb0' }}>{activeChange.location}</div>
              </div>
              {activeChange.removeText && (
                <div>
                  <div style={{ fontSize: 11, color: '#c0392b', fontFamily: 'monospace', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Remove This Text</div>
                  <div style={{ background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#e07060', lineHeight: 1.7 }}>{activeChange.removeText}</div>
                </div>
              )}
              <div>
                <div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'monospace', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{activeChange.action==='replace'?'Replace With':'Insert This Text'}</div>
                <div style={{ background: 'rgba(29,158,117,0.08)', border: '1px solid rgba(29,158,117,0.25)', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#c0e8d8', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{activeChange.insertText}</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><div style={{ fontSize: 11, color: '#5a6a7a', fontFamily: 'monospace', marginBottom: 4, textTransform: 'uppercase' }}>Rationale</div><div style={{ fontSize: 12, color: '#8a9ab0', lineHeight: 1.6 }}>{activeChange.rationale}</div></div>
                <div><div style={{ fontSize: 11, color: '#1D9E75', fontFamily: 'monospace', marginBottom: 4, textTransform: 'uppercase' }}>Score Impact</div><div style={{ fontSize: 13, color: '#1D9E75', fontWeight: 600 }}>{activeChange.scoreImpact}</div></div>
              </div>
            </div>
          )}

          {doc.changes.length === 0 && (
            <div style={{ background: '#1a2530', border: '1px solid #2a3a4a', borderRadius: 12, padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>✓</div>
              <div style={{ fontSize: 15, color: '#1D9E75', marginBottom: 6 }}>No changes suggested</div>
              <div style={{ fontSize: 13, color: '#8a9ab0' }}>Ready for NIH upload in current form.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
