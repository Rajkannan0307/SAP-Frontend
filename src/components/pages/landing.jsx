import React from "react";
import { Link } from "react-router-dom";

const Landing = () => {
    const api = "http://rmlvlcyawsapps:2003";

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
                backgroundColor: "#f4f6f8",
            }}
        >
            <h1
                // style={{
                //     textAlign: "center",
                //     color: "#333",
                //     margin: "10px 0",
                //     flexShrink: 0,
                // }}
                className="text-2xl! text-center font-bold! mt-2"
            >
                MANUFACTURING WORKSPACE
            </h1>

            <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
                {/* Left Side */}
                <div
                    style={{
                        width: "30%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        padding: "10px",
                        backgroundColor: "#0ABAB5",
                        borderRadius: "12px",
                        boxSizing: "border-box",
                        marginTop: '0.5%',
                        height: '97%'
                    }}
                >
                    <Link to="/login" style={{ textAlign: "" }}>
                        <img
                            src="/Login1.jpg"
                            alt="Login"
                            style={{
                                width: "80%",
                                maxHeight: "70%",
                                borderRadius: "12px",
                                boxShadow: "0px 4px 12px rgba(0,0,0,0.2)",
                                objectFit: "contain",
                                transition: "transform 0.3s ease",
                            }}
                            onMouseOver={(e) =>
                                (e.currentTarget.style.transform = "scale(1.05)")
                            }
                            onMouseOut={(e) =>
                                (e.currentTarget.style.transform = "scale(1)")
                            }
                        />
                        <h2 className="text-2xl! text-center mr-24 mt-5 font-bold!">Login</h2>
                    </Link>
                </div>

                {/* Right Side */}
                <div
                    style={{
                        width: "70%",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "15px",
                        backgroundColor: "#f9fafb",
                        padding: "10px",
                        boxSizing: "border-box",
                    }}
                >
                    {/* Mysore */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "5px",
                            backgroundColor: "#56DFCF",
                        }}
                    >
                        <div style={{ marginBottom: "10px", color: "black" }} className="text-md font-bold">MYSORE</div>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1200/1200`}>
                                    <img
                                        src="/pic1.png"
                                        alt="Store1"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">SSLP Store</h4>
                            </div>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1200/1226`}>
                                    <img
                                        src="/pic2.png"
                                        alt="Store2"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">HYP Store</h4>
                            </div>
                        </div>
                    </div>

                    {/* Pondy */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "5px",
                            backgroundColor: "#ADEED9",
                        }}
                    >
                        <h3 style={{ marginBottom: "10px", color: "black" }} className="text-md! font-bold!">PONDY</h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1300/1300`}>
                                    <img
                                        src="/pic1.png"
                                        alt="Store1"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">SSLP Store</h4>
                            </div>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1300/1308`}>
                                    <img
                                        src="/pic2.png"
                                        alt="Store2"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!"> SGP Store</h4>
                            </div>
                        </div>
                    </div>

                    {/* Varanavasi */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "5px",
                            backgroundColor: "#ADEED9",
                        }}
                    >
                        <h3 style={{ marginBottom: "10px", color: "black" }} className="text-md! font-bold!">VARANAVASI</h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1150/1150`}>
                                    <img
                                        src="/pic1.png"
                                        alt="Store1"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">Balljoint Store</h4>
                            </div>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1150/1174`}>
                                    <img
                                        src="/pic2.png"
                                        alt="Store2"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">Linkage / R&P Store</h4>
                            </div>
                        </div>
                    </div>

                    {/* Pant Nagar */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            border: "1px solid #e5e7eb",
                            borderRadius: "12px",
                            padding: "5px",
                            backgroundColor: "#56DFCF",
                        }}
                    >
                        <h3 style={{ marginBottom: "10px", color: "black" }} className="text-md! font-bold!">PANT NAGAR</h3>
                        <div style={{ display: "flex", gap: "10px" }}>
                            <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1250/1250`}>
                                    <img
                                        src="/pic1.png"
                                        alt="Store1"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4 className="text-md! font-bold!">RM Store</h4>
                            </div>
                            {/* <div style={{ textAlign: "center", flex: 1 }}>
                                <Link to={`${api}/Store/1250/1251`}>
                                    <img
                                        src="/pic2.png"
                                        alt="Store2"
                                        style={{
                                            width: "90%",
                                            maxHeight: "200px",
                                            objectFit: "contain",
                                            borderRadius: "8px",
                                            border: "2px solid",
                                        }}
                                        onMouseOver={(e) =>
                                            (e.currentTarget.style.transform = "scale(1.05)")
                                        }
                                        onMouseOut={(e) =>
                                            (e.currentTarget.style.transform = "scale(1)")
                                        }
                                    />
                                </Link>
                                <h4>Store 2</h4>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Landing;
