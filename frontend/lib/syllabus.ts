// lib/syllabus.ts
// Complete CA and CMA syllabus structure
// Used by Home, Onboarding, Subject, Chapter screens

export const syllabus = {

    ca: {
      foundation: {
        hasGroups: false,
        subjects: [
          { id:"ca_f_acc",   code:"Paper 1", title:"Principles & Practice of Accounting", icon:"📊", color:"#185FA5", bg:"#DBEAFE", chapters:8  },
          { id:"ca_f_law",   code:"Paper 2", title:"Business Laws",                        icon:"⚖️", color:"#3B6D11", bg:"#DCFCE7", chapters:6  },
          { id:"ca_f_maths", code:"Paper 3", title:"Business Mathematics, LR & Statistics",icon:"🔢", color:"#854F0B", bg:"#FEF9C3", chapters:7  },
          { id:"ca_f_eco",   code:"Paper 4", title:"Business Economics",                   icon:"📈", color:"#0F6E56", bg:"#CCFBF1", chapters:5  },
        ],
      },
      inter: {
        hasGroups: true,
        groups: {
          1: [
            { id:"ca_i_advacc", code:"Paper 1", title:"Advanced Accounting",          icon:"📊", color:"#185FA5", bg:"#DBEAFE", chapters:10 },
            { id:"ca_i_law",    code:"Paper 2", title:"Corporate & Other Laws",        icon:"⚖️", color:"#3B6D11", bg:"#DCFCE7", chapters:8  },
            { id:"ca_i_tax",    code:"Paper 3", title:"Taxation",                      icon:"🧾", color:"#854F0B", bg:"#FEF9C3", chapters:9  },
          ],
          2: [
            { id:"ca_i_cma",    code:"Paper 4", title:"Cost & Management Accounting",  icon:"💰", color:"#0F6E56", bg:"#CCFBF1", chapters:8  },
            { id:"ca_i_audit",  code:"Paper 5", title:"Auditing & Ethics",              icon:"🔍", color:"#7C3AED", bg:"#EDE9FE", chapters:7  },
            { id:"ca_i_fm",     code:"Paper 6", title:"Financial Management & Strategic Management", icon:"📋", color:"#DC2626", bg:"#FEF2F2", chapters:8 },
          ],
        },
      },
      final: {
        hasGroups: true,
        groups: {
          1: [
            { id:"ca_fin_fr",    code:"Paper 1", title:"Financial Reporting",                    icon:"📊", color:"#185FA5", bg:"#DBEAFE", chapters:10 },
            { id:"ca_fin_afm",   code:"Paper 2", title:"Advanced Financial Management",          icon:"💹", color:"#3B6D11", bg:"#DCFCE7", chapters:9  },
            { id:"ca_fin_audit", code:"Paper 3", title:"Advanced Auditing",                      icon:"🔍", color:"#854F0B", bg:"#FEF9C3", chapters:8  },
          ],
          2: [
            { id:"ca_fin_law",   code:"Paper 4", title:"Corporate & Economic Laws",              icon:"⚖️", color:"#0F6E56", bg:"#CCFBF1", chapters:8  },
            { id:"ca_fin_scpm",  code:"Paper 5", title:"Strategic Cost & Performance Management",icon:"📋", color:"#7C3AED", bg:"#EDE9FE", chapters:7  },
            { id:"ca_fin_rm",    code:"Paper 6", title:"Risk Management",                        icon:"🛡️", color:"#DC2626", bg:"#FEF2F2", chapters:6  },
          ],
        },
      },
    },
  
    cma: {
      foundation: {
        hasGroups: false,
        subjects: [
          { id:"cma_f_law",   code:"Paper 1", title:"Fundamentals of Business Laws & Communication", icon:"⚖️", color:"#185FA5", bg:"#DBEAFE", chapters:5 },
          { id:"cma_f_acc",   code:"Paper 2", title:"Fundamentals of Financial & Cost Accounting",   icon:"📊", color:"#3B6D11", bg:"#DCFCE7", chapters:9 },
          { id:"cma_f_maths", code:"Paper 3", title:"Fundamentals of Business Mathematics & Statistics", icon:"🔢", color:"#854F0B", bg:"#FEF9C3", chapters:8 },
          { id:"cma_f_eco",   code:"Paper 4", title:"Fundamentals of Business Economics & Management",   icon:"📈", color:"#0F6E56", bg:"#CCFBF1", chapters:7 },
        ],
      },
      inter: {
        hasGroups: true,
        groups: {
          1: [
            { id:"cma_i_facc",  code:"Paper 5",  title:"Financial Accounting",                          icon:"📊", color:"#185FA5", bg:"#DBEAFE", chapters:10 },
            { id:"cma_i_law",   code:"Paper 6",  title:"Laws & Ethics",                                 icon:"⚖️", color:"#3B6D11", bg:"#DCFCE7", chapters:7  },
            { id:"cma_i_dtax",  code:"Paper 7",  title:"Direct Taxation",                               icon:"🧾", color:"#854F0B", bg:"#FEF9C3", chapters:8  },
            { id:"cma_i_cacc",  code:"Paper 8",  title:"Cost Accounting",                               icon:"💰", color:"#0F6E56", bg:"#CCFBF1", chapters:9  },
          ],
          2: [
            { id:"cma_i_ops",   code:"Paper 9",  title:"Operations Management & Strategic Management",  icon:"⚙️", color:"#7C3AED", bg:"#EDE9FE", chapters:8  },
            { id:"cma_i_corp",  code:"Paper 10", title:"Corporate Accounting & Auditing",               icon:"🔍", color:"#DC2626", bg:"#FEF2F2", chapters:7  },
            { id:"cma_i_fm",    code:"Paper 11", title:"Financial Management & Business Data Analytics", icon:"📋", color:"#0F6E56", bg:"#CCFBF1", chapters:8  },
            { id:"cma_i_itax",  code:"Paper 12", title:"Indirect Taxation",                             icon:"🧾", color:"#185FA5", bg:"#DBEAFE", chapters:7  },
          ],
        },
      },
      final: {
        hasGroups: true,
        groups: {
          1: [
            { id:"cma_fin_law",  code:"Paper 13", title:"Corporate & Economic Laws",                           icon:"⚖️", color:"#185FA5", bg:"#DBEAFE", chapters:8  },
            { id:"cma_fin_sfm",  code:"Paper 14", title:"Strategic Financial Management",                      icon:"💹", color:"#3B6D11", bg:"#DCFCE7", chapters:9  },
            { id:"cma_fin_dtax", code:"Paper 15", title:"Direct Tax Laws & International Taxation",            icon:"🧾", color:"#854F0B", bg:"#FEF9C3", chapters:10 },
            { id:"cma_fin_scm",  code:"Paper 16", title:"Strategic Cost Management",                           icon:"💰", color:"#0F6E56", bg:"#CCFBF1", chapters:8  },
          ],
          2: [
            { id:"cma_fin_audit", code:"Paper 17", title:"Cost & Management Audit",                            icon:"🔍", color:"#7C3AED", bg:"#EDE9FE", chapters:7  },
            { id:"cma_fin_cfr",   code:"Paper 18", title:"Corporate Financial Reporting",                      icon:"📊", color:"#DC2626", bg:"#FEF2F2", chapters:8  },
            { id:"cma_fin_itax",  code:"Paper 19", title:"Indirect Tax Laws & Practice",                       icon:"🧾", color:"#185FA5", bg:"#DBEAFE", chapters:9  },
            { id:"cma_fin_spm",   code:"Paper 20", title:"Strategic Performance Management & Business Valuation",icon:"📋",color:"#0F6E56", bg:"#CCFBF1", chapters:8  },
          ],
        },
      },
    },
  };
  
  // Helper — get subjects for a student
  export function getSubjects(
    course: string,
    level: string,
    group?: number
  ): any[] {
    const c = syllabus[course as keyof typeof syllabus];
    if (!c) return [];
    const l = c[level as keyof typeof c] as any;
    if (!l) return [];
    if (!l.hasGroups) return l.subjects || [];
    if (group) return l.groups?.[group] || [];
    // No group selected — return Group 1 as default
    return l.groups?.[1] || [];
  }
  
  // Helper — check if level has groups
  export function hasGroups(course: string, level: string): boolean {
    const c = syllabus[course as keyof typeof syllabus];
    if (!c) return false;
    const l = c[level as keyof typeof c] as any;
    return l?.hasGroups || false;
  }