/* app/page.tsx */

import React from "react";

export default function Home() {
  return (
    <div className="min-h-screen">
      <h2 className="text-headline-lg font-headline-md text-white mb-lg">Operations & Management</h2>
      <div className="mb-xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {/* Placeholder for Operations Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-blue text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-blue">OPERATIONS</h4>
              </div>
              <span className="text-[10px] bg-tanstack-cyan text-black px-1.5 py-0.5 rounded font-black">ACTIVE</span>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-blue mb-sm">Standard protocols for emergency response and daily inspections.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Staff-focused repository of community guidelines, crisis management protocols, and institutional checklists.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>12 Documents</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Placeholder for Tenants Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-green text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-green">TENANTS</h4>
              </div>
              <span className="text-[10px] bg-tanstack-yellow text-black px-1.5 py-0.5 rounded font-black">BETA</span>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-green mb-sm">Customizable welcome packets and move-in guides.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Essential resident resources including utility connection guides, insurance requirements, and amenity rules.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>8 Documents</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Placeholder for Maintenance Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-yellow text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-yellow">MAINTENANCE</h4>
              </div>
              <span className="text-[10px] bg-tanstack-pink text-white px-1.5 py-0.5 rounded font-black">ALPHA</span>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-yellow mb-sm">Troubleshooting manuals for common appliance issues.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Detailed HVAC seasonal maintenance logs and common plumbing fix tutorials for on-site technicians.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>24 Documents</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-xl">
        <h3 className="text-headline-md text-white mb-lg">Strategy & Compliance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
          {/* Placeholder for Legal Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-cyan text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-cyan">LEGAL</h4>
              </div>
              <span className="text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-black">CRITICAL</span>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-cyan mb-sm">Fair Housing Act regulations and eviction notice templates.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Localized leasing law summaries and regulatory compliance checklists for risk mitigation.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>15 Documents</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Placeholder for Marketing Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-pink text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-pink">MARKETING</h4>
              </div>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-pink mb-sm">Property images and brand identity guidelines.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              High-res asset library, social media posting schedules, and tenant outreach templates.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>42 Files</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>

          {/* Placeholder for Financial Card */}
          <div className="bg-card-bg border border-card-border p-lg rounded-arch card-glow transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start mb-md">
              <div className="flex items-center gap-sm">
                <span className="bg-tanstack-blue text-white text-[10px] font-black px-1.5 py-0.5 rounded leading-none">R-Note</span>
                <h4 className="text-title-lg font-bold text-tanstack-blue">FINANCE</h4>
              </div>
              <span className="text-[10px] bg-tanstack-cyan text-black px-1.5 py-0.5 rounded font-black">NEW</span>
            </div>
            <p className="text-body-md font-bold italic text-tanstack-blue mb-sm">Accounts receivable and security deposit returns.</p>
            <p className="text-body-md text-on-surface-variant mb-xl leading-relaxed">
              Streamlined tax filing checklists and internal accounting workflows for management.
            </p>
            <div className="mt-auto pt-md flex items-center justify-between text-label-md text-outline">
              <span>10 Documents</span>
              <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-xl">
        <div className="flex items-center justify-between mb-lg">
          <h3 className="text-title-lg font-headline-md text-white flex items-center gap-sm">
            <span className="material-symbols-outlined text-outline">schedule</span>
            Recently Modified
          </h3>
        </div>
        <div className="bg-card-bg border border-card-border rounded-arch overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#111] border-b border-card-border">
              <tr>
                <th className="px-lg py-3 text-[10px] font-bold text-outline uppercase tracking-widest">Title</th>
                <th className="px-lg py-3 text-[10px] font-bold text-outline uppercase tracking-widest">Type</th>
                <th className="px-lg py-3 text-[10px] font-bold text-outline uppercase tracking-widest text-right">
                  Modified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border">
              <tr className="hover:bg-[#151515] transition-colors cursor-pointer group">
                <td className="px-lg py-4">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-tanstack-blue text-[18px]">description</span>
                    <span className="text-body-md font-medium text-white group-hover:text-tanstack-blue">Q3
                      Safety Inspection Protocols</span>
                  </div>
                </td>
                <td className="px-lg py-4">
                  <span
                    className="text-[10px] font-bold text-tanstack-blue px-2 py-0.5 rounded border border-tanstack-blue/30 bg-tanstack-blue/5">Operations</span>
                </td>
                <td className="px-lg py-4 text-body-md text-on-surface-variant text-right">2h ago</td>
              </tr>
              <tr className="hover:bg-[#151515] transition-colors cursor-pointer group">
                <td className="px-lg py-4">
                  <div className="flex items-center gap-sm">
                    <span className="material-symbols-outlined text-tanstack-cyan text-[18px]">policy</span>
                    <span className="text-body-md font-medium text-white group-hover:text-tanstack-cyan">Fair
                      Housing Training Guide 2024</span>
                  </div>
                </td>
                <td className="px-lg py-4">
                  <span
                    className="text-[10px] font-bold text-tanstack-cyan px-2 py-0.5 rounded border border-tanstack-cyan/30 bg-tanstack-cyan/5">Legal</span>
                </td>
                <td className="px-lg py-4 text-body-md text-on-surface-variant text-right">Yesterday</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
