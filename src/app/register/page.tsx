"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAccount, RegistrationPayload } from "../../lib/user_auth";

export default function RegisterPage() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // MyKad parsed states (Sprint 2 - Commit 1)
  const [name, setName] = useState("");
  const [icNumber, setIcNumber] = useState("");
  const [addressIC, setAddressIC] = useState("");
  const [gender, setGender] = useState("");
  const [religion, setReligion] = useState("");
  const [citizenship, setCitizenship] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsParsing(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Attempt to hit the OCR parsing endpoint
      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setName(data.name || "");
        setIcNumber(data.icNumber || "");
        setAddressIC(data.addressIC || "");
        setGender(data.gender || "");
        setReligion(data.religion || "");
        setCitizenship(data.citizenship || "");
      } else {
        console.warn("OCR API returned an error status, using mock fallback parser data.");
        triggerFallbackMock();
      }
    } catch (err) {
      console.warn("OCR API is offline or failed, using mock fallback parser data:", err);
      triggerFallbackMock();
    } finally {
      setIsParsing(false);
    }
  };

  const triggerFallbackMock = () => {
    setName("AHMAD BIN ZAKI");
    setIcNumber("850101-14-5567");
    setAddressIC("No. 12, Jalan Utama, 56000 Kuala Lumpur");
    setGender("Male");
    setReligion("Islam");
    setCitizenship("Warganegara");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }
    
    // Sprint 4 Placeholder: Keep this until Twilio is ready!
    if (otp !== "123456") {
      setErrorMsg("Invalid OTP code. (Hint: use 123456)");
      return;
    }

    // Sprint 2 verification checkbox validation
    if (name && !isVerified) {
      setErrorMsg("Please confirm that your MyKad details are verified.");
      return;
    }

    setIsLoading(true);

    try {
      const payload: RegistrationPayload = {
        name: name || "Not Scanned", 
        icNumber: icNumber || "Not Scanned",
        addressIC: addressIC || "Not Scanned",
        gender: gender || "Pending",
        religion: religion || "Pending",
        citizenship: citizenship || "Pending",
        
        addressCurrent: "", 
        maritalStatus: "",
        occupation: "",
        monthlyIncome: 0,
        phoneNumber: phoneNumber, 
      };

      const newUser = await registerAccount(email, password, payload);
      
      console.log("Account created securely in Firestore:", newUser);
      localStorage.setItem("userRole", newUser.role);
      
      router.push("/dashboard");
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case "auth/email-already-in-use":
          setErrorMsg("An account with this email already exists.");
          break;
        case "auth/weak-password":
          setErrorMsg("Password should be at least 6 characters.");
          break;
        default:
          setErrorMsg(err.message || "Failed to create account.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background font-sans overflow-x-hidden">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full h-14 flex items-center justify-between px-6 z-50 bg-white border-b border-[#E2E8F0]">
        <div className="flex items-center gap-3">
          <span className="text-base font-bold text-[#002D62] tracking-tight">
            Sistem Borang Pengesahan Penghulu
          </span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center pt-20 pb-8 px-6">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Section */}
          <div className="hidden lg:flex lg:col-span-7 flex-col space-y-6">
             <h1 className="text-3xl font-bold leading-tight tracking-tight text-primary">
                Sistem Borang Pengesahan Penghulu
             </h1>
          </div>

          {/* Right Section (Form) */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-surface-container-lowest border border-[#E2E8F0] rounded-xl p-6 shadow-sm">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="text-xl font-semibold text-primary mb-1">Create Account</h2>
                <p className="text-xs text-on-surface-variant">Fill in the details below to start.</p>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm text-center font-medium">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Email Address</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="name@example.com"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Phone Number</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="+60123456789"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* OTP Verification */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-on-surface">OTP Verification</label>
                  <div className="flex gap-2">
                    <input
                      className="flex-grow px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="6-digit code (use 123456)"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      className="px-4 py-2.5 bg-surface-container-high text-primary font-semibold rounded-lg hover:bg-surface-container-highest transition-all whitespace-nowrap text-xs disabled:opacity-50"
                      type="button"
                      disabled={isLoading}
                    >
                      Request OTP
                    </button>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Password</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="••••••••"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-on-surface">Confirm</label>
                    <input
                      className="w-full px-3 py-2.5 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-sm"
                      placeholder="••••••••"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* MyKad Upload UI (Sprint 2 - Commit 1) */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-on-surface">MyKad Verification</label>
                  <input
                    id="mykad-file-input"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isLoading || isParsing}
                  />
                  {isParsing ? (
                    <div className="border-2 border-dashed border-primary bg-primary/5 rounded-xl p-6 flex flex-col items-center justify-center text-center animate-pulse">
                      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
                      <p className="text-[11px] font-bold text-primary">Reading MyKad Data...</p>
                      <p className="text-[9px] text-on-surface-variant mt-0.5">Please wait, extracting details</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 grid-cols-2">
                      <div
                        onClick={() => !isLoading && document.getElementById("mykad-file-input")?.click()}
                        className={`border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors bg-surface-container-low ${
                          isLoading ? "opacity-50" : "hover:border-primary cursor-pointer group"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-1 text-on-surface-variant group-hover:text-primary">
                          upload_file
                        </span>
                        <p className="text-[11px] font-medium text-on-surface">Upload Image</p>
                      </div>
                      <div
                        onClick={() => !isLoading && document.getElementById("mykad-file-input")?.click()}
                        className={`border-2 border-dashed border-outline-variant rounded-xl p-4 flex flex-col items-center justify-center text-center transition-colors bg-surface-container-low ${
                          isLoading ? "opacity-50" : "hover:border-primary cursor-pointer group"
                        }`}
                      >
                        <span className="material-symbols-outlined text-2xl mb-1 text-on-surface-variant group-hover:text-primary">
                          photo_camera
                        </span>
                        <p className="text-[11px] font-medium text-on-surface">Take Photo</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Collapsible Verification Panel (Sprint 2 - Commit 3) */}
                {name && !isParsing && (
                  <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 space-y-4 animate-fade-in">
                    <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
                      <span className="material-symbols-outlined text-primary text-lg">verified</span>
                      <h3 className="text-xs font-bold text-primary uppercase tracking-wide">
                        Verify &amp; Edit Profile Details
                      </h3>
                    </div>

                    <p className="text-[10px] text-on-surface-variant leading-relaxed">
                      Please verify that the information extracted from your MyKad is correct. Edit any fields if necessary.
                    </p>

                    <div className="space-y-3">
                      {/* Name input */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-on-surface">Full Name</label>
                        <input
                          className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      {/* IC and Gender Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface">IC Number</label>
                          <input
                            className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs"
                            type="text"
                            placeholder="e.g. 850101-14-5567"
                            value={icNumber}
                            onChange={(e) => setIcNumber(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface">Gender</label>
                          <select
                            className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs cursor-pointer"
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            required
                            disabled={isLoading}
                          >
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Religion and Citizenship Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface">Religion</label>
                          <input
                            className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs"
                            type="text"
                            placeholder="e.g. Islam"
                            value={religion}
                            onChange={(e) => setReligion(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-on-surface">Citizenship</label>
                          <input
                            className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs"
                            type="text"
                            placeholder="e.g. Warganegara"
                            value={citizenship}
                            onChange={(e) => setCitizenship(e.target.value)}
                            required
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Address input */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-on-surface">Permanent Address (IC)</label>
                        <textarea
                          className="w-full px-3 py-2 bg-white border border-outline rounded-lg focus:ring-2 focus:ring-primary outline-none text-xs resize-none"
                          rows={2}
                          value={addressIC}
                          onChange={(e) => setAddressIC(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {/* Verification Toggle */}
                    <label className="flex items-start gap-2 pt-2 border-t border-outline-variant cursor-pointer group">
                      <input
                        type="checkbox"
                        className="mt-0.5 rounded border-outline text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        checked={isVerified}
                        onChange={(e) => setIsVerified(e.target.checked)}
                        disabled={isLoading}
                      />
                      <span className="text-[10px] font-medium text-on-surface-variant group-hover:text-on-surface transition-colors select-none">
                        I confirm that my MyKad details above are correct and authentic.
                      </span>
                    </label>
                  </div>
                )}

                <div className="pt-3 border-t border-outline-variant">
                  <button
                    type="submit"
                    disabled={isLoading || isParsing || (name ? !isVerified : false)}
                    className={`w-full py-3 font-bold rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
                      isLoading || isParsing || (name ? !isVerified : false)
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary-container active:scale-[0.98] cursor-pointer"
                    }`}
                  >
                    <span>{isLoading ? "Creating Account..." : "Create Account"}</span>
                    {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
                  </button>
                  <div className="mt-4 text-center">
                    <p className="text-xs text-on-surface-variant">
                      Already have an account?{" "}
                      <Link className="text-primary font-bold hover:underline" href="/login">
                        Log in here
                      </Link>
                    </p>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}