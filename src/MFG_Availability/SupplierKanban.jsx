import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Dialog, Tooltip } from "@mui/material";
import { Eye, History as HistoryIconLine, Mail as MailIconLine } from "lucide-react";
import CloseIcon from "@mui/icons-material/Close";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SearchIcon from "@mui/icons-material/Search";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import { toast } from "react-toastify";
import FilterSelect from "../components/FilterSelect";
import InfoTip from "../components/InfoTip";
import { GetSupplierKanbanApi, GetSupplierKanbanDetailApi, SendSupplierKanbanMailApi, GetSupplierKanbanHistoryApi, GetSupplierKanbanHistoryCardApi } from "../controller/RmCoverageApiService";
import { fmtNum } from "./rmCoverageUtils";

// Supplier Kanban: the second tab of the Child Part Coverage screen (tabs: components/PillTabs.jsx).
//   One row per vendor of the child parts: R / Y / G = the Child Part Coverage status of the vendor's child parts.
//   View = the vendor's materials with the Total Requirement; Mail = the same table mailed to the vendor (To) and the buyer (CC),
//   available only when the vendor's Kanban mail flag (Vendor Master) is Yes and it has a mail id; otherwise the button explains why.
//   History = the vendor's past Kanban mails (saved by the backend each time Mail is pressed), each openable as the card that was mailed.
// The numbers and the mail are built by the backend (MFG_BOM/RmCoverage.router.js, SupplierKanbanCalc.js); this screen shows them.
// Styled with Tailwind classes; MUI is used only for the modal container (focus trap, Escape, backdrop) and the shared Plant dropdown.

const TH = "sticky top-0 z-[2] h-10 whitespace-nowrap border-b border-[#b9c8ec] bg-[#d0dcf5] px-2.5 text-center text-[10.5px] font-bold text-black";
const TD = "whitespace-nowrap border-b border-[#eef0f3] px-2.5 py-1.5 text-[11.5px] text-[#333]";
const BTN = "inline-flex h-[30px] cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed";
const BTN_PRIMARY = `${BTN} bg-[#0066FF] text-white hover:bg-[#0052cc] disabled:bg-[#b9c8ec] disabled:hover:bg-[#b9c8ec]`;
// The actions of a list row are ONE joined control: three segments in a bordered group (View | History | Mail), so they read as buttons
// and not as the counts beside them. Mail is the filled segment; when it cannot be used it is an empty, greyed segment.
const SEG = "inline-flex h-8 w-9 cursor-pointer items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#93b8ff] disabled:cursor-not-allowed";
const SEG_VIEW = `${SEG} text-[#2563eb] hover:bg-[#eef4ff]`;
const SEG_HISTORY = `${SEG} border-l border-[#e3e8f2] text-[#475569] hover:bg-[#f1f5f9]`;
const SEG_MAIL = `${SEG} border-l border-[#e3e8f2] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:bg-[#f8fafc] disabled:text-[#c3cbd6] disabled:hover:bg-[#f8fafc]`;
const BTN_OUTLINE = `${BTN} border border-[#c9d3e6] bg-white text-[#0066FF] hover:bg-[#f3f7ff] disabled:opacity-50`;

// header cell with a short explanation on hover (the app's shared hover card, same as the Coverage tab)
const Head = ({ tip, className = TH, children }) => (
  <th className={className}>
    <InfoTip trigger={children} {...tip} />
  </th>
);

// The four cover bands of the list: a supplier's child parts counted by their Coverage Days (Current Stock / Demand per Day, as on Child Part Coverage)
const BANDS = [
  { key: "R", count: "r", range: "< 1 day", color: "#d32f2f", text: "#fff", rule: "under 1 day" },
  { key: "Y", count: "y", range: "1 - 2 days", color: "#f5b301", text: "#1a2233", rule: "1 day up to under 3 days (1 - 2 days)" },
  { key: "G", count: "g", range: "3 - 5 days", color: "#2e7d32", text: "#fff", rule: "3 to 5 days" },
  { key: "B", count: "b", range: "> 5 days", color: "#1976d2", text: "#fff", rule: "more than 5 days" },
];
const bandTip = (band) => ({
  title: `${band.key} = ${band.range} of cover`,
  text: `Number of this supplier's child parts whose Coverage Days is ${band.rule}. Coverage Days = Current Stock ÷ Demand per Day, as on Child Part Coverage.`,
  note: band.key === "B" ? "A part with no demand this month (plan 0) has nothing to cover and is counted as B." : undefined,
});

// what each header says on hover
const TIPS = {
  si: { text: "Serial number of the supplier in the list." },
  vendor: {
    title: "Vendor",
    text: "The vendor set on the child part's Material Master. Every vendor of the listed child parts is shown. The label beside the name is the vendor's Kanban mail flag (Yes / No) from the Vendor Master.",
  },
  buyer: { title: "Buyer", text: "The buyer set on the Vendor Master. His mail is copied (CC) on the Kanban mail of this supplier." },
  kanban: {
    title: "Kanban",
    points: [
      "The icons: eye = View, clock = History, envelope = Mail. Hover an icon for its name.",
      "View: the supplier's materials with the Total Requirement.",
      "History: the Kanban mails sent to this supplier before, each one opens as the card that was mailed.",
      "Mail: sends the same table to the supplier (To) and the buyer (CC). It is available only when the supplier's Kanban mail is Yes on the Vendor Master and it has a mail id; otherwise the button is greyed out and says why.",
    ],
  },
};

const Spinner = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
    <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// '2026-10-30 12:37:52' (stored IST text) -> '30-Oct-26 12:37'
const SENT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const fmtSent = (text) => {
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(String(text || ""));
  return m ? `${m[3]}-${SENT_MONTHS[Number(m[2]) - 1]}-${m[1].slice(2)} ${m[4]}:${m[5]}` : "";
};
const MAIL_STATUS = {
  SENT: { text: "Sent", cls: "bg-[#e3f4e6] text-[#2e7d32]", hint: "The mail was sent" },
  PENDING: { text: "Pending", cls: "bg-[#fff4d6] text-[#8a6500]", hint: "The mail was being sent and no result was saved" },
  FAILED: { text: "Failed", cls: "bg-[#fde8e8] text-[#c62828]", hint: "The mail could not be sent" },
  SENDING: { text: "Sending...", cls: "bg-[#e8f1ff] text-[#1d4ed8]", hint: "The mail is being sent" },
  UNCONFIRMED: { text: "Not confirmed", cls: "bg-[#fff4d6] text-[#8a6500]", hint: "The mail was not confirmed as sent. Check with the supplier, or send again." },
};
// a mail still PENDING after 3 minutes will never finish: it is shown as "Not confirmed"
const mailStatusKey = (row) => (row.status === "PENDING" ? (Number(row.age_min) > 3 ? "UNCONFIRMED" : "SENDING") : row.status);
const todayText = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };

// The card page (built by the backend) in a frame as tall as the card; print() prints only the card
const CardFrame = forwardRef(({ html }, ref) => {
  const frame = useRef(null);
  const [height, setHeight] = useState(520);
  useImperativeHandle(ref, () => ({
    print: () => { const win = frame.current?.contentWindow; if (win) { win.focus(); win.print(); } },
  }));
  return (
    <iframe
      ref={frame}
      title="Kanban Collection Card"
      srcDoc={html || ""}
      scrolling="no"
      onLoad={() => {
        // the frame is as tall as the card, kept in step when the card's width (and so its height) changes: the dialog is the only thing that scrolls
        const doc = frame.current?.contentDocument;
        if (!doc?.body) return;
        const fit = () => setHeight(Math.ceil(doc.body.getBoundingClientRect().height) + 24);
        fit();
        if (typeof ResizeObserver !== "undefined") new ResizeObserver(fit).observe(doc.body);
      }}
      className="block w-full border-0 bg-white shadow-[0_1px_6px_rgba(16,24,40,0.12)]"
      style={{ height }}
    />
  );
});

// a count in the colour of its cover band; grey when 0
const CountPill = ({ band, count }) => {
  const on = count > 0;
  return (
    <span
      className="inline-flex h-[22px] min-w-[30px] items-center justify-center rounded-full px-2 text-[11.5px] font-bold"
      style={on ? { backgroundColor: band.color, color: band.text } : { backgroundColor: "#eef0f3", color: "#a4a9b3" }}
    >
      {count}
    </span>
  );
};

const SupplierKanban = ({ plants, plantSelect, onPlantChange, plantCodes, month, onMonthChange, searchText = "", onCountChange }) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState(null); // { vendor, loading, detail }
  const [confirm, setConfirm] = useState(null); // the vendor a mail is about to be sent for
  const [sending, setSending] = useState(false);
  const [kanbanFilter, setKanbanFilter] = useState("All"); // All / Yes / No: the vendor's Kanban mail flag (Vendor Master)
  const [buyerFilter, setBuyerFilter] = useState("All"); // the vendor's buyer (Vendor Master)
  const [productFilter, setProductFilter] = useState("All"); // only the child parts of this Product are listed and counted
  const [products, setProducts] = useState([]);
  const [history, setHistory] = useState(null); // { vendor, loading, rows, missing }: the History dialog
  const [historyCard, setHistoryCard] = useState(null); // { row, loading, data }: one past mail's card
  const autoLoaded = useRef(false);
  const viewFrame = useRef(null);
  const historyFrame = useRef(null);
  const printCard = () => viewFrame.current?.print();

  const params = useMemo(() => ({ plants: plantCodes.join(","), month }), [plantCodes, month]);

  const load = useCallback(async () => {
    if (plantCodes.length === 0) {
      toast.warning("You have no plant to show.");
      return;
    }
    if (!/^[0-9]{4}-(0[1-9]|1[0-2])$/.test(String(month || ""))) {
      toast.warning("Please select a valid month (for example Oct 2026).");
      return;
    }
    setLoading(true);
    try {
      const data = await GetSupplierKanbanApi({ ...params, product: productFilter === "All" ? "" : productFilter });
      setVendors(data?.vendors || []);
      setProducts(data?.products || []);
      setLoaded(true);
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load the Supplier Kanban.");
      setVendors([]);
    } finally {
      setLoading(false);
    }
  }, [params, plantCodes.length, month, productFilter]);

  // open the tab = show the list once the plant list is there; after that the user presses Search
  useEffect(() => {
    if (autoLoaded.current || plantCodes.length === 0) return;
    autoLoaded.current = true;
    load();
  }, [plantCodes, load]);

  // a Product that is no longer in the list (another plant or month) goes back to All
  useEffect(() => { if (productFilter !== "All" && loaded && !products.includes(productFilter)) setProductFilter("All"); }, [products, productFilter, loaded]);
  // changing the Product shows the list for it at once (the Product is worked out on the server)
  const productSeen = useRef(productFilter);
  useEffect(() => {
    if (productSeen.current === productFilter) return;
    productSeen.current = productFilter;
    if (loaded) load();
  }, [productFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  const buyerOptions = useMemo(() => [...new Set(vendors.map((v) => v.buyer_name).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [vendors]);
  useEffect(() => { if (buyerFilter !== "All" && !buyerOptions.includes(buyerFilter)) setBuyerFilter("All"); }, [buyerOptions, buyerFilter]);

  // the search box above the tabs finds a vendor by code, name or mail id
  const shownVendors = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return vendors.filter((v) => {
      if (kanbanFilter === "Yes" && !v.kanban_mail) return false;
      if (kanbanFilter === "No" && v.kanban_mail) return false;
      if (buyerFilter !== "All" && v.buyer_name !== buyerFilter) return false;
      return !q || `${v.vendor_code} ${v.vendor_name} ${v.buyer_name || ""} ${v.mail_id || ""}`.toLowerCase().includes(q);
    });
  }, [vendors, searchText, kanbanFilter, buyerFilter]);
  useEffect(() => { if (onCountChange) onCountChange(vendors.length); }, [vendors.length, onCountChange]);

  const openView = async (vendor) => {
    setView({ vendor, loading: true, detail: null });
    try {
      const detail = await GetSupplierKanbanDetailApi({ ...params, vendorId: vendor.vendor_id });
      setView({ vendor, loading: false, detail });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load the Kanban details.");
      setView(null);
    }
  };

  const openHistory = async (vendor) => {
    setHistory({ vendor, loading: true, rows: [], missing: false });
    try {
      const data = await GetSupplierKanbanHistoryApi({ plants: params.plants, vendorId: vendor.vendor_id, month });
      setHistory({ vendor, loading: false, rows: data?.history || [], missing: Boolean(data?.missing) });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load the Kanban mail history.");
      setHistory(null);
    }
  };

  const openHistoryCard = async (row) => {
    setHistoryCard({ row, loading: true, data: null });
    try {
      const data = await GetSupplierKanbanHistoryCardApi({ plants: params.plants, logId: row.log_id });
      setHistoryCard({ row, loading: false, data });
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Failed to load this Kanban mail.");
      setHistoryCard(null);
    }
  };

  const sendMail = async () => {
    if (!confirm || sending) return;
    setSending(true);
    try {
      const result = await SendSupplierKanbanMailApi({ ...params, vendorId: confirm.vendor_id, userId: localStorage.getItem("EmpId") });
      toast.success(result?.message || "Kanban mail sent.");
      setConfirm(null);
      load(); // the "last mailed" of the vendor
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to send the Kanban mail. Please try again.");
    }
    setSending(false);
  };

  const noMail = (v) => !v.mail_id;
  // why Mail is not available for a vendor (empty when it is): the Kanban mail flag and the mail id both come from the Vendor Master
  const mailBlockedReason = (v) => {
    if (!v.kanban_mail) return "Kanban mail is set to No for this vendor. Set 'Kanban mail' to Yes on the Vendor Master to send mail.";
    if (noMail(v)) return "This vendor has no mail id. Add it on the Vendor Master.";
    return "";
  };
  const lines = view?.detail?.lines || [];
  const viewVendor = view ? vendors.find((x) => x.vendor_id === view.vendor.vendor_id) || view.vendor : null;

  // Mail is always shown so the three buttons line up in every row. It is disabled, with the reason on hover, for a vendor whose Kanban
  // mail flag is No or that has no mail id. The title sits on a wrapper: a disabled button does not show its own hover text in every browser.
  const mailButton = (v, iconOnly = false) => {
    const blocked = mailBlockedReason(v);
    return (
      <Tooltip title={blocked || "Mail this Kanban to the vendor"} arrow placement="top" enterDelay={200}>
        <span className={`inline-flex ${blocked ? "cursor-not-allowed" : ""}`}>
          <button
            type="button"
            disabled={Boolean(blocked)}
            onClick={() => setConfirm(v)}
            aria-label="Mail"
            className={`${iconOnly ? SEG_MAIL : BTN_PRIMARY} ${blocked ? "pointer-events-none" : ""}`}
          >
            {iconOnly ? <MailIconLine size={16} strokeWidth={1.9} /> : <><MailOutlineIcon sx={{ fontSize: 15 }} /> Mail</>}
          </button>
        </span>
      </Tooltip>
    );
  };

  return (
    <>
      <div className="mb-1.5 flex flex-wrap items-center gap-2 rounded-lg border border-[#e8eaee] bg-white px-2.5 py-[7px] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
        <FilterSelect label="Plant" value={plantSelect} options={plants} onChange={onPlantChange} minWidth={190} />
        <div className="relative">
          <label className="absolute -top-[7px] left-2 z-[1] bg-white px-1 text-[9.5px] text-[#6b7280]">Month</label>
          <input
            type="month"
            value={month}
            min="2000-01"
            max="2099-12"
            onChange={(e) => onMonthChange(e.target.value)}
            className="h-[30px] w-[150px] rounded-md border border-[#dde1e7] bg-[#fafbfc] px-2 text-[11px] text-[#333] outline-none hover:border-[#0066FF] focus:border-[#0066FF]"
          />
        </div>
        <FilterSelect label="Kanban mail" value={kanbanFilter} options={["Yes", "No"]} onChange={setKanbanFilter} minWidth={140} />
        <FilterSelect label="Buyer" value={buyerFilter} options={buyerOptions} onChange={setBuyerFilter} minWidth={150} />
        <FilterSelect label="Product" value={productFilter} options={products} onChange={setProductFilter} minWidth={150} />
        <button type="button" onClick={load} disabled={loading} className={BTN_PRIMARY}>
          {loading ? <Spinner className="h-3 w-3" /> : <SearchIcon sx={{ fontSize: 16 }} />}
          {loading ? "Loading..." : "Search"}
        </button>
        <span className="ml-auto text-[11px] font-semibold text-[#6b7280]">
          {loaded && (shownVendors.length === vendors.length
            ? `${vendors.length} supplier${vendors.length === 1 ? "" : "s"}`
            : `${shownVendors.length} of ${vendors.length} suppliers`)}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-[#e8eaee] bg-white">
        <table className="w-full table-fixed border-separate border-spacing-0">
          <colgroup>
            <col className="w-[5%]" /><col /><col className="w-[22%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[7%]" /><col className="w-[140px]" />
          </colgroup>
          <thead>
            <tr>
              <Head tip={TIPS.si}>SI.No</Head>
              <Head tip={TIPS.vendor} className={`${TH} !text-left`}>Vendor</Head>
              <Head tip={TIPS.buyer} className={`${TH} !text-left`}>Buyer</Head>
              {BANDS.map((band) => (
                <Head key={band.key} tip={bandTip(band)}>
                  <span className="block leading-tight">
                    <span className="block text-[11px]">{band.key}</span>
                    <span className="block text-[9px] font-medium text-[#4b5565]">{band.range}</span>
                  </span>
                </Head>
              ))}
              <Head tip={TIPS.kanban}>Kanban</Head>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className={`${TD} py-6 text-center text-[#8a93a3]`}><Spinner className="mx-auto h-[18px] w-[18px]" /></td></tr>
            )}
            {!loading && loaded && shownVendors.length === 0 && (
              <tr>
                <td colSpan={8} className={`${TD} !whitespace-normal py-7 text-center text-[#8a93a3]`}>
                  {vendors.length === 0 ? "No child part with a vendor was found for this plant and month." : "No supplier matches your search or filter."}
                </td>
              </tr>
            )}
            {!loading && shownVendors.map((v, i) => (
              <tr key={v.vendor_id} className={i % 2 ? "bg-[#fafbfd]" : "bg-white"}>
                <td className={`${TD} text-center text-[#8a93a3]`}>{i + 1}</td>
                <td className={`${TD} !whitespace-normal`}>
                  <div className="font-semibold text-[#1a2233]">
                    {v.vendor_name} <span className="font-normal text-[#8a93a3]">({v.vendor_code})</span>
                    <span
                      title={v.kanban_mail ? "Kanban mail is Yes for this vendor on the Vendor Master" : "Kanban mail is No for this vendor on the Vendor Master: Mail is not available. Set it to Yes on the Vendor Master."}
                      className={`ml-2 rounded-full px-2 py-px text-[10px] font-semibold ${v.kanban_mail ? "bg-[#e3f4e6] text-[#2e7d32]" : "bg-[#eef0f3] text-[#6b7280]"}`}
                    >
                      Kanban mail: {v.kanban_mail ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="text-[10.5px] text-[#8a93a3]">{`${v.parts} part${v.parts === 1 ? "" : "s"}`}</div>
                </td>
                <td className={`${TD} overflow-hidden`} title={v.buyer_name ? `${v.buyer_name}${v.buyer_email ? ` <${v.buyer_email}> (copied on the Kanban mail)` : " (no mail on the User Master)"}` : "No buyer on the Vendor Master"}>
                  {v.buyer_name ? (
                    <>
                      <div className="truncate font-medium text-[#1a2233]">{v.buyer_name}</div>
                      <div className="truncate text-[10.5px] text-[#8a93a3]">{v.buyer_email || "no mail"}</div>
                    </>
                  ) : (
                    <span className="text-[#a4a9b3]">-</span>
                  )}
                </td>
                {BANDS.map((band) => (
                  <td key={band.key} className={`${TD} text-center`}><CountPill band={band} count={v[band.count] || 0} /></td>
                ))}
                <td className={`${TD} text-center`}>
                  <div className="inline-flex h-8 items-stretch overflow-hidden rounded-lg border border-[#d5dcea] bg-white shadow-sm">
                    <Tooltip title="View the Kanban card" arrow placement="top" enterDelay={200}>
                      <button type="button" onClick={() => openView(v)} className={SEG_VIEW} aria-label="View">
                        <Eye size={16} strokeWidth={1.9} />
                      </button>
                    </Tooltip>
                    <Tooltip
                      title={v.last_mailed_on ? `Mail history | last mailed ${fmtSent(v.last_mailed_on)}${v.last_card_no ? ` (${v.last_card_no})` : ""}${v.last_mailed_by ? ` by ${v.last_mailed_by}` : ""}` : "Mail history | no Kanban mail has been sent to this supplier yet"}
                      arrow
                      placement="top"
                      enterDelay={200}
                    >
                      <button type="button" onClick={() => openHistory(v)} className={SEG_HISTORY} aria-label="History">
                        <HistoryIconLine size={16} strokeWidth={1.9} />
                      </button>
                    </Tooltip>
                    {mailButton(v, true)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View: the Kanban Collection Card, the same page that is printed and mailed (built by the backend) */}
      <Dialog open={Boolean(view)} onClose={() => setView(null)} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
        {view && (
          <div className="flex max-h-[92vh] flex-col bg-[#f5f6f8]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e6ec] bg-white px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-[#1a2233]">
                  Kanban Collection Card <span className="font-normal text-[#6b7280]">| {view.vendor.vendor_name} ({view.vendor.vendor_code})</span>
                </div>
                {view.detail && (
                  <div className="text-[10.5px] text-[#8a93a3]">
                    {lines.filter((l) => l.total_requirement > 0).length} of {lines.length} part{lines.length === 1 ? "" : "s"} to collect
                  </div>
                )}
                {/* the Cart No does not exist yet: it is created when the card is mailed (the line on the card stays blank for a hand-written number) */}
                <div className="text-[10.5px] text-[#8a93a3]">
                  Cart No is created when the card is mailed.
                  {viewVendor.last_mailed_on && viewVendor.last_mailed_on.startsWith(todayText()) && (
                    <> Last mailed today{viewVendor.last_card_no ? <>: <b className="text-[#5b6472]">{viewVendor.last_card_no}</b></> : null} at {viewVendor.last_mailed_on.slice(11, 16)}.</>
                  )}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" disabled={!view.detail} onClick={printCard} className={BTN_OUTLINE} title="Print this card">
                  <PrintOutlinedIcon sx={{ fontSize: 15 }} /> Print
                </button>
                {mailButton(view.vendor)}
                <button type="button" onClick={() => setView(null)} className={BTN_OUTLINE}>Close</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {view.loading ? (
                <div className="p-10 text-center text-[#0066FF]"><Spinner className="mx-auto h-[22px] w-[22px]" /></div>
              ) : (
                <CardFrame ref={viewFrame} html={view.detail?.card_html} />
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* History: the Kanban mails sent to this vendor, newest first */}
      <Dialog open={Boolean(history)} onClose={() => setHistory(null)} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
        {history && (
          <div className="flex max-h-[85vh] flex-col bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e6ec] px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-[#1a2233]">
                  Kanban mail history <span className="font-normal text-[#6b7280]">| {history.vendor.vendor_name} ({history.vendor.vendor_code})</span>
                </div>
                {!history.loading && <div className="text-[10.5px] text-[#8a93a3]">{history.rows.length} mail{history.rows.length === 1 ? "" : "s"} in {month || "all months"}, selected plant{plantCodes.length === 1 ? "" : "s"}</div>}
              </div>
              <button type="button" onClick={() => setHistory(null)} className={BTN_OUTLINE}>Close</button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              {history.loading ? (
                <div className="p-10 text-center text-[#0066FF]"><Spinner className="mx-auto h-[22px] w-[22px]" /></div>
              ) : (
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr>
                      <th className={TH}>SI.No</th>
                      <th className={TH}>Plant</th>
                      <th className={`${TH} !text-left`}>Card No</th>
                      <th className={`${TH} !text-left`}>Sent on</th>
                      <th className={`${TH} !text-left`}>Sent by</th>
                      <th className={`${TH} !text-left`}>To</th>
                      <th className={TH}>Materials</th>
                      <th className={TH}>Total Requirement</th>
                      <th className={TH}>Status</th>
                      <th className={TH}>Card</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.rows.length === 0 && (
                      <tr>
                        <td colSpan={10} className={`${TD} !whitespace-normal py-7 text-center text-[#8a93a3]`}>
                          {history.missing ? "The Kanban mail history is not set up yet (run 08_migration.sql)." : "No Kanban mail has been sent to this supplier yet for the selected plant."}
                        </td>
                      </tr>
                    )}
                    {history.rows.map((h, i) => (
                      <tr key={h.log_id} className={i % 2 ? "bg-[#fafbfd]" : "bg-white"}>
                        <td className={`${TD} text-center text-[#8a93a3]`}>{i + 1}</td>
                        <td className={`${TD} text-center`} title={h.plant_name || ""}>{h.plant_codes}</td>
                        <td className={`${TD} font-semibold text-[#1a2233]`}>{h.card_no || "-"}</td>
                        <td className={TD}>{fmtSent(h.sent_on)}</td>
                        <td className={TD}>{h.sent_by_name || "-"}</td>
                        <td className={`${TD} !whitespace-normal`}>{h.mail_to}{h.mail_cc ? <span className="text-[#8a93a3]"> (cc {h.mail_cc})</span> : null}</td>
                        <td className={`${TD} text-center`}>{h.material_count}</td>
                        <td className={`${TD} text-center font-semibold`}>{fmtNum(h.total_requirement, 3)}</td>
                        <td className={`${TD} text-center`}>
                          <span
                            title={h.status === "FAILED" ? h.error_message || MAIL_STATUS.FAILED.hint : (MAIL_STATUS[mailStatusKey(h)] || MAIL_STATUS.FAILED).hint}
                            className={`rounded-full px-2 py-px text-[10px] font-semibold ${(MAIL_STATUS[mailStatusKey(h)] || MAIL_STATUS.FAILED).cls}`}
                          >
                            {(MAIL_STATUS[mailStatusKey(h)] || MAIL_STATUS.FAILED).text}
                          </span>
                        </td>
                        <td className={`${TD} text-center`}>
                          <button type="button" onClick={() => openHistoryCard(h)} className={BTN_OUTLINE}>
                            <VisibilityOutlinedIcon sx={{ fontSize: 15 }} /> View card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* One past mail: the card as it was mailed (drawn again from the saved lines) */}
      <Dialog open={Boolean(historyCard)} onClose={() => setHistoryCard(null)} maxWidth="xl" fullWidth PaperProps={{ sx: { borderRadius: "12px", overflow: "hidden" } }}>
        {historyCard && (
          <div className="flex max-h-[92vh] flex-col bg-[#f5f6f8]">
            <div className="flex items-center justify-between gap-3 border-b border-[#e3e6ec] bg-white px-4 py-2.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold text-[#1a2233]">
                  Kanban Collection Card <span className="font-normal text-[#6b7280]">| {historyCard.row.card_no ? `Cart No ${historyCard.row.card_no} | ` : ""}mailed {fmtSent(historyCard.row.sent_on)}{historyCard.row.sent_by_name ? ` by ${historyCard.row.sent_by_name}` : ""}</span>
                </div>
                <div className="text-[10.5px] text-[#8a93a3]">
                  To {historyCard.row.mail_to}{historyCard.row.mail_cc ? ` | cc ${historyCard.row.mail_cc}` : ""} | {(MAIL_STATUS[mailStatusKey(historyCard.row)] || MAIL_STATUS.FAILED).text}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" disabled={!historyCard.data} onClick={() => historyFrame.current?.print()} className={BTN_OUTLINE} title="Print this card">
                  <PrintOutlinedIcon sx={{ fontSize: 15 }} /> Print
                </button>
                <button type="button" onClick={() => setHistoryCard(null)} className={BTN_OUTLINE}>Close</button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-auto p-4">
              {historyCard.loading ? (
                <div className="p-10 text-center text-[#0066FF]"><Spinner className="mx-auto h-[22px] w-[22px]" /></div>
              ) : (
                <CardFrame ref={historyFrame} html={historyCard.data?.card_html} />
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Mail: confirm the recipients first */}
      <Dialog open={Boolean(confirm)} onClose={() => (sending ? null : setConfirm(null))} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: "12px" } }}>
        {confirm && (
          <div className="p-5">
            <div className="text-[15px] font-bold text-[#1a2233]">Send Kanban mail?</div>
            <p className="mt-1 text-xs text-[#6b7280]">
              The Kanban card of <b>{confirm.vendor_name}</b> ({confirm.vendor_code}) will be mailed as shown in View.
            </p>
            <div className="mt-3 space-y-1 text-xs text-[#333]">
              <div><b className="inline-block w-9 text-[#6b7280]">To</b>{confirm.mail_id}</div>
              <div><b className="inline-block w-9 text-[#6b7280]">CC</b>{confirm.buyer_email || <span className="text-[#a4a9b3]">no buyer mail (not copied)</span>}</div>
            </div>
            {confirm.last_mailed_on && confirm.last_mailed_on.startsWith(todayText()) && (
              <div className="mt-3 rounded-md border border-[#f5d58a] bg-[#fff8e6] px-3 py-2 text-[11.5px] text-[#7a5a00]">
                Already mailed today at <b>{confirm.last_mailed_on.slice(11, 16)}</b>{confirm.last_mailed_by ? <> by <b>{confirm.last_mailed_by}</b></> : null}. Send again?
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" disabled={sending} onClick={() => setConfirm(null)} className={BTN_OUTLINE}>Cancel</button>
              <button type="button" disabled={sending} onClick={sendMail} className={BTN_PRIMARY}>
                {sending ? <Spinner className="h-3 w-3" /> : <MailOutlineIcon sx={{ fontSize: 15 }} />}
                {sending ? "Sending..." : "Send"}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </>
  );
};

export default SupplierKanban;
