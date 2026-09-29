import React, { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { Snackbar, Alert } from "@mui/material";
import LoginImage from "../images/llogin.png";
import { getLogin } from "../../controller/Masterapiservice";
import { encryptSessionData } from "../../controller/StorageUtils";
import { AuthContext } from "../../Authentication/AuthContext";

const api = "http://rmlvlcyawsapps:2003";

const PLANTS = [
    {
        name: "VARANAVASI",
        code: "VRN-03",
        dot: "bg-indigo-600",
        codeBadge: "text-indigo-800 bg-indigo-100/80",
        stores: [
            {
                label: "Balljoint Store",
                sub: "Mechanical Line",
                icon: "settings_suggest",
                iconBg: "bg-indigo-100 group-hover:bg-indigo-600 text-indigo-700",
                hoverText: "group-hover:text-indigo-700",
                to: `${api}/Store/1150/1150`,
            },
            {
                label: "Linkage / R&P",
                sub: "Assembly Line",
                icon: "alt_route",
                iconBg: "bg-violet-100 group-hover:bg-violet-600 text-violet-700",
                hoverText: "group-hover:text-violet-700",
                to: `${api}/Store/1150/1174`,
            },
        ],
    },
    {
        name: "MYSORE",
        code: "MYS-01",
        dot: "bg-teal-600",
        codeBadge: "text-teal-800 bg-teal-100/80",
        stores: [
            {
                label: "SSLP Store",
                sub: "Inventory & Dispatch",
                icon: "desktop_windows",
                iconBg: "bg-teal-100 group-hover:bg-teal-600 text-teal-700",
                hoverText: "group-hover:text-teal-700",
                to: `${api}/Store/1200/1200`,
            },
            {
                label: "HYP Store",
                sub: "Hydraulic Parts",
                icon: "insights",
                iconBg: "bg-sky-100 group-hover:bg-sky-600 text-sky-700",
                hoverText: "group-hover:text-sky-700",
                to: `${api}/Store/1200/1226`,
            },
        ],
    },
    {
        name: "PONDY",
        code: "PDY-02",
        dot: "bg-cyan-600",
        codeBadge: "text-cyan-800 bg-cyan-100/80",
        stores: [
            {
                label: "SSLP Store",
                sub: "Inventory & Buffer",
                icon: "desktop_windows",
                iconBg: "bg-cyan-100 group-hover:bg-cyan-600 text-cyan-700",
                hoverText: "group-hover:text-cyan-700",
                to: `${api}/Store/1300/1300`,
            },
            {
                label: "SGP Store",
                sub: "Spares & General",
                icon: "inventory_2",
                iconBg: "bg-blue-100 group-hover:bg-blue-600 text-blue-700",
                hoverText: "group-hover:text-blue-700",
                to: `${api}/Store/1300/1308`,
            },
        ],
    },
    {
        name: "PANT NAGAR",
        code: "PNG-04",
        dot: "bg-emerald-600",
        codeBadge: "text-emerald-800 bg-emerald-100/80",
        stores: [
            {
                label: "RM Store",
                sub: "Raw Materials & Spares",
                icon: "warehouse",
                iconBg: "bg-emerald-100 group-hover:bg-emerald-600 text-emerald-700",
                hoverText: "group-hover:text-emerald-700",
                to: `${api}/Store/1250/1250`,
            },
        ],
        centralHub: true,
    },
];

const Landing = () => {
    const [username, setUserName] = useState("");
    const [password, setPassword] = useState("");
    const [openError, setOpenError] = useState(false);
    const [openSuccess, setOpenSuccess] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [openPlant, setOpenPlant] = useState(() => PLANTS[0]?.name ?? null);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useContext(AuthContext);

    const togglePlant = (name) => {
        setOpenPlant((prev) => (prev === name ? null : name));
    };

    const handleLogin = async (e) => {
        e.preventDefault();

        if (!username || !password) {
            setError("Enter Username and Password");
            setOpenError(true);
            return;
        }

        setLoading(true);
        try {
            const response = await getLogin({
                Employee_ID: username,
                Password: password,
            });

            if (response.data.message === "success") {
                const data = response.data.resultLocalStorage[0];
                if (data) {
                    localStorage.setItem("Active", data.Active_Status);
                    localStorage.setItem("DeptId", data.Dept_Id);
                    localStorage.setItem("UserName", data.User_Name);
                    localStorage.setItem("UserID", data.User_ID);
                    localStorage.setItem("Deptname", data.Dept_Name);
                    localStorage.setItem("PlantName", data.Plant_Name);
                    localStorage.setItem("Email", data.User_Email);
                    localStorage.setItem("Plantcode", data.Plant_Code);
                    localStorage.setItem("EmpId", data.Employee_ID);
                    localStorage.setItem("RoleID", data.Role_ID);
                    localStorage.setItem("Approval_Level", data.User_Level_ID);
                    localStorage.setItem("UserLevel", data.User_Level);
                    localStorage.setItem("Permission", data.Screen_Codes);
                    localStorage.setItem("Plant_ID", data.Plant_ID);
                    localStorage.setItem("CompanyId", data.Com_ID);

                    const selectedData = {
                        Active: data.Active_Status,
                        DeptId: data.Dept_Id,
                        UserName: data.User_Name,
                        UserID: data.User_ID,
                        DeptName: data.Dept_Name,
                        PlantName: data.Plant_Name,
                        Email: data.User_Email,
                        PlantCode: data.Plant_Code,
                        EmpId: data.Employee_ID,
                        RoleId: data.Role_ID,
                        UserLevelName: data.User_Level_Name,
                        CompanyCode: data.Company_code,
                        CompanyName: data.Company_name,
                        CompanyId: data.Com_ID,
                        PlantID: data.Plant_ID,
                        UserLevel: data.User_Level,
                        Role: data.Role_Name,
                        Permissions: data.Screen_Codes,
                        login: true,
                    };

                    const encryptedData = encryptSessionData(selectedData);
                    sessionStorage.setItem("userData", encryptedData);

                    setOpenSuccess(true);

                    // Role-based redirection
                    setTimeout(() => {
                        switch (data.Role_ID) {
                            case 2:
                                window.location.href = "/home/PMPD_ProductionPlan";
                                break;
                            case 3:
                            case 4:
                            case 5:
                            case 6:
                            case 7:
                            case 8:
                            case 10:
                                window.location.href = "/home/HomePage";
                                break;
                            case 1:
                            case 9:
                                window.location.href = "/home/Home";
                                break;
                            case 11:
                                window.location.href = "/home/Home";
                                break;
                            case 14:
                                window.location.href = "/home/rigMonthlyStatus";
                                break;
                            case 15:
                                window.location.href = "/home/PMPD_ProductionPlan";
                                break;
                            case 16:
                                window.location.href = "/home/PMPD_ProductionPlan";
                                break;
                            case 17:
                                window.location.href = "/home/MatAvailabilityStatus";
                                break;
                            default:
                                window.location.href = "/home/Home";
                                break;
                        }
                    }, 100);
                }
            } else {
                setError(response.data.message || "Login failed. Please try again.");
                setOpenError(true);
                setLoading(false);
            }
        } catch (error) {
            console.log("Error Logging in:", error);

            if (error.response && error.response.status === 401) {
                setError(error.response.data.message || "Invalid credentials.");
            } else if (error.response && error.response.data && error.response.data.message) {
                setError(error.response.data.message);
            } else {
                setError("Something went wrong. Try again.");
            }

            setOpenError(true);
            setLoading(false);
        }
    };

    const storeCount = PLANTS.reduce((sum, p) => sum + p.stores.length, 0);

    return (
        <div className="bg-[#f1f5f9] text-slate-800 h-screen overflow-hidden flex flex-col antialiased selection:bg-sky-500 selection:text-white">
            <style>{`
                @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes livePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45); } 70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); } }
                @keyframes particleFloat {
                    0% { transform: translate3d(0, 0, 0) scale(1); opacity: 0; }
                    15% { opacity: 0.9; }
                    85% { opacity: 0.9; }
                    100% { transform: translate3d(var(--drift-x, 12px), -70px, 0) scale(0.6); opacity: 0; }
                }
            `}</style>
            {/* Header */}
            <header
                className="w-full bg-white border-b border-slate-200/90 shadow-sm px-6 lg:px-12 py-2.5 z-30 flex-shrink-0"
                style={{ animation: "fadeSlideUp 0.4s ease-out both" }}
            >
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-[#16417C] to-[#0284c7] flex items-center justify-center text-white shadow-md shadow-blue-900/20">
                            <span className="material-symbols-outlined text-lg">precision_manufacturing</span>
                        </div>
                        <div>
                            <h1 className="text-sm md:text-balance font-bold tracking-wide text-slate-900 uppercase leading-tight">Manufacturing Workspace</h1>
                            {/* <p className="text-[10px] text-slate-500  hidden sm:block leading-tight">Central Operations &amp; Inventory Management Portal</p> */}
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Systems Online
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="flex-1 min-h-0 w-full mx-auto px-4 sm:px-6 lg:px-10 py-6 md:py-8 flex flex-col justify-center overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-stretch h-full max-h-180 min-h-0 mx-[7%]">
                    {/* Left: Authentication */}
                    <section
                        className="lg:col-span-8 flex flex-col"
                        style={{ animation: "fadeSlideUp 0.5s ease-out 0.1s both" }}
                    >
                        <div className="rounded-2xl shadow-[0_20px_45px_-12px_rgba(22,57,108,0.35)] relative flex flex-col lg:flex-row h-full min-h-0 overflow-y-auto overflow-x-hidden bg-white">
                            {/* Left brand panel */}
                            <div className="relative overflow-hidden flex flex-col text-white flex-shrink-0 w-full lg:w-[42%] p-6 sm:p-7 bg-gradient-to-br from-[#1B4C87] to-[#0284c7]">
                                {[
                                    { left: "8%", bottom: "8%", size: 4, delay: 0, duration: 7, drift: 16 },
                                    { left: "18%", bottom: "55%", size: 3, delay: 1.5, duration: 6, drift: -12 },
                                    { left: "30%", bottom: "20%", size: 5, delay: 2.8, duration: 8, drift: 10 },
                                    { left: "42%", bottom: "75%", size: 3, delay: 0.8, duration: 6.5, drift: -16 },
                                    { left: "55%", bottom: "10%", size: 4, delay: 3.6, duration: 7.5, drift: 14 },
                                    { left: "65%", bottom: "60%", size: 3, delay: 1.2, duration: 6, drift: -10 },
                                    { left: "75%", bottom: "30%", size: 5, delay: 2.2, duration: 8, drift: 12 },
                                    { left: "85%", bottom: "70%", size: 3, delay: 4, duration: 6.5, drift: -14 },
                                    { left: "92%", bottom: "15%", size: 4, delay: 0.4, duration: 7, drift: 10 },
                                    { left: "50%", bottom: "40%", size: 3, delay: 3.2, duration: 6, drift: -12 },
                                ].map((p, i) => (
                                    <span
                                        key={i}
                                        className="absolute z-0 rounded-full bg-sky-200/70 pointer-events-none"
                                        style={{
                                            left: p.left,
                                            bottom: p.bottom,
                                            width: p.size,
                                            height: p.size,
                                            "--drift-x": `${p.drift}px`,
                                            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
                                        }}
                                    />
                                ))}

                                <span className="relative z-10 inline-flex items-center gap-1.5 self-start px-3 py-1 rounded-full text-xs font-medium tracking-wide bg-white/10 border border-white/20 text-sky-100 flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-sky-300 animate-pulse" />
                                    SAP ERP Integration
                                </span>

                                <div className="relative z-10 mt-6 flex-1 min-h-0 flex items-center justify-center">
                                    <img
                                        alt="SAP Approval Flow"
                                        src={LoginImage}
                                        className="relative max-w-full max-h-[340px] w-auto h-auto object-contain rounded-xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.45)]"
                                    />
                                </div>

                                <div className="relative z-10 mt-4 pt-3 border-t border-white/15 text-xs text-blue-100/70 flex-shrink-0">
                                    <p>Enterprise Plant Management</p>
                                </div>
                            </div>

                            {/* Right login panel */}
                            <div className="flex-1 flex items-center justify-center p-7 sm:p-10">
                                <div className="w-full max-w-[380px]">
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-100">
                                        Authorized Personnel Only
                                    </span>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-3">Login</h2>
                                    <p className="text-sm text-slate-500 mt-1.5">
                                        Enter your Login ID and password to access the Manufacturing Workspace portal.
                                    </p>

                                    <form onSubmit={handleLogin} className="space-y-4 mt-6">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="login-id">Login ID</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">person</span>
                                                </div>
                                                <input
                                                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/30 focus:border-[#0284c7] focus:bg-white placeholder:text-slate-400 text-slate-800 transition-all"
                                                    id="login-id"
                                                    name="loginId"
                                                    placeholder="Enter Login ID"
                                                    required
                                                    type="text"
                                                    value={username}
                                                    onChange={(e) => setUserName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-1.5" htmlFor="password">Password</label>
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                                    <span className="material-symbols-outlined text-lg">lock</span>
                                                </div>
                                                <input
                                                    className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-[#0284c7]/30 focus:border-[#0284c7] focus:bg-white placeholder:text-slate-400 text-slate-800 transition-all"
                                                    id="password"
                                                    name="password"
                                                    placeholder="Enter account password"
                                                    required
                                                    type={showPassword ? "text" : "password"}
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPassword((v) => !v)}
                                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                                    tabIndex={-1}
                                                >
                                                    <span className="material-symbols-outlined text-lg">
                                                        {showPassword ? "visibility_off" : "visibility"}
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                        <button
                                            className="w-full py-3 px-8 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] disabled:bg-[#0284c7]/60 disabled:cursor-not-allowed text-white font-semibold text-sm tracking-wide uppercase shadow-md shadow-sky-600/25 transition-all duration-200 mt-2 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                                            type="submit"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <span className="h-3.5 w-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                            ) : null}
                                            {loading ? "Logging in..." : "Login"}
                                            {!loading && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
                                        </button>
                                        <div className="text-center pt-1">
                                            {/* <a className="text-xs text-[#0284c7] hover:text-[#0369a1] font-medium transition-colors" href="#">
                                                Forgot password or need help?
                                            </a> */}
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Right: Plants & Stores grid */}
                    <section
                        className="lg:col-span-4 flex flex-col h-full min-h-0"
                        style={{ animation: "fadeSlideUp 0.5s ease-out 0.2s both" }}
                    >
                        <div className="flex items-start justify-between px-1 mb-3 shrink-0 flex-wrap gap-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-medium text-slate-700 tracking-tight">Open Order Status</h2>
                                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full bg-emerald-500"
                                            style={{ animation: "livePulse 2s ease-out infinite" }}
                                        />
                                        Live
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">Select store to access</p>
                            </div>
                            <span className="text-[10px] bg-white border border-slate-200 text-slate-500 font-medium px-2.5 py-1 rounded-full whitespace-nowrap">
                                {PLANTS.length} Plants &bull; {storeCount} Stores
                            </span>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden pr-1">
                            <div className="flex flex-col gap-3">
                                {PLANTS.map((plant, plantIndex) => {
                                    const isOpen = openPlant === plant.name;
                                    return (
                                        <div
                                            key={plant.name}
                                            className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_-2px_rgba(15,23,42,0.06)] overflow-hidden"
                                            style={{ animation: `fadeSlideUp 0.4s ease-out ${plantIndex * 0.08}s both` }}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => togglePlant(plant.name)}
                                                className="w-full flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${plant.dot}`} />
                                                    <h3 className="font-medium text-slate-700 text-sm tracking-wide truncate">{plant.name}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-md border border-slate-200 text-slate-500 bg-white">{plant.code}</span>
                                                    <span
                                                        className={`material-symbols-outlined text-lg text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
                                                    >
                                                        expand_more
                                                    </span>
                                                </div>
                                            </button>

                                            <div
                                                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-100 opacity-100" : "max-h-0 opacity-0"}`}
                                            >
                                                <div className="space-y-2 px-3 pb-3 pt-2">
                                                    {plant.stores.map((store) => (
                                                        <Link
                                                            key={store.label}
                                                            to={store.to}
                                                            className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-slate-200 cursor-pointer"
                                                        >
                                                            <div className="flex items-center gap-2.5 min-w-0">
                                                                <div className={`h-9 w-9 rounded-lg group-hover:text-white flex items-center justify-center transition-colors shrink-0 ${store.iconBg}`}>
                                                                    <span className="material-symbols-outlined text-lg">{store.icon}</span>
                                                                </div>
                                                                <div className="truncate">
                                                                    <div className="text-xs font-medium text-slate-700 truncate">{store.label}</div>
                                                                    <div className="text-[10px] text-slate-400 truncate">{store.sub}</div>
                                                                </div>
                                                            </div>
                                                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex-shrink-0">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" style={{ animation: "livePulse 2s ease-out infinite" }} />
                                                                Active
                                                            </span>
                                                        </Link>
                                                    ))}

                                                    {plant.centralHub && (
                                                        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-slate-500">
                                                            <div className="flex items-center gap-2">
                                                                <span className="material-symbols-outlined text-sm text-slate-400">hub</span>
                                                                <span className="text-[10px] font-medium text-slate-600">Central Hub Linked</span>
                                                            </div>
                                                            <span className="text-[9px] text-slate-400 font-mono">NODE-04</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Snackbar
                open={openError}
                autoHideDuration={1500}
                onClose={() => setOpenError(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity="error">{error}</Alert>
            </Snackbar>

            <Snackbar
                open={openSuccess}
                autoHideDuration={200}
                onClose={() => setOpenSuccess(false)}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert severity="success">Login successful!</Alert>
            </Snackbar>
        </div>
    );
};

export default Landing;
