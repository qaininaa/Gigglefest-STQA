import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../utils/axios";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      if (response.data.status === "success") {
        // Store token if provided
        if (response.data.data?.token) {
          localStorage.setItem("token", response.data.data.token);
        }

        // Show success message
        setSuccess(true);

        // Navigate to homepage after a brief delay
        setTimeout(() => {
          navigate("/");
        }, 1000);
      }
    } catch (err) {
      // Handle different error types
      let errorMessage = "Login gagal. Silakan coba lagi.";

      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message || "";

        if (status === 401) {
          errorMessage = "Email atau password salah. Silakan coba lagi.";
        } else if (status === 403 && message.includes("verify")) {
          errorMessage =
            "Email Anda belum diverifikasi. Silakan cek email Anda.";
        } else if (message) {
          errorMessage = message;
        }
      } else if (err.request) {
        errorMessage =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Curved cream background on right */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%]">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <path d="M 30 0 Q 10 50 30 100 L 100 100 L 100 0 Z" fill="#FFF5EB" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="w-full max-w-7xl flex items-center justify-between relative z-10 px-12">
        {/* Left Section - Form */}
        <div className="w-[45%] pr-8">
          <h1 className="text-7xl font-bold text-white mb-6">GiggleWest</h1>

          <p className="text-yellow-300 text-xl mb-10 font-medium">
            Masuk untuk mengakses GiggleWest
          </p>

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            data-testid="login-form"
          >
            {error && (
              <div
                className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-shake"
                data-testid="error-message"
              >
                <span className="text-2xl">⚠️</span>
                <div>
                  <p className="font-semibold">Login Gagal</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}

            {success && (
              <div
                className="bg-green-100 border-2 border-green-400 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3"
                data-testid="success-message"
              >
                <span className="text-2xl">✓</span>
                <div>
                  <p className="font-semibold">Login Berhasil!</p>
                  <p className="text-sm">Mengalihkan ke halaman utama...</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-white text-lg mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-4 border-yellow-400 focus:outline-none focus:border-yellow-500 text-lg bg-white"
                data-testid="email-input"
                required
              />
            </div>

            <div>
              <label className="block text-white text-lg mb-2 font-medium">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl border-4 border-yellow-400 focus:outline-none focus:border-yellow-500 text-lg bg-white"
                data-testid="password-input"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-yellow-400 hover:bg-yellow-500 text-purple-700 font-bold text-xl px-12 py-3 rounded-xl transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="login-button"
            >
              {loading ? "MASUK..." : "MASUK"}
            </button>
          </form>
        </div>

        {/* Right Section - Illustration */}
        <div className="w-[50%] relative flex justify-center items-center">
          <div className="relative w-full max-w-xl">
            <h2 className="text-purple-600 font-bold text-4xl text-right mb-16 pr-12">
              CARI KESERUANMU DI
              <br />
              GIGGLEWEST
            </h2>

            {/* Decorative icons */}
            <div className="absolute top-24 left-32 text-4xl">🌙</div>
            <div className="absolute top-32 right-32 text-3xl">⭐</div>
            <div className="absolute top-20 left-56 text-3xl">🟡</div>
            <div className="absolute top-28 right-48 text-2xl">✓</div>
            <div className="absolute top-40 right-24 text-2xl">❌</div>
            <div className="absolute top-48 right-16 text-2xl transform rotate-90">
              〰️
            </div>

            {/* Illustration - Two people */}
            <div className="relative flex items-end justify-center gap-16 mt-20">
              {/* Person 1 - Left (blue shirt) */}
              <div className="relative flex flex-col items-center">
                {/* Heart above */}
                <div className="absolute -top-16 right-8 text-5xl">❤️</div>

                {/* Head */}
                <div className="w-20 h-20 bg-yellow-300 rounded-full mb-2 relative overflow-hidden">
                  <div className="absolute top-8 left-5 w-2 h-3 bg-gray-800 rounded-full"></div>
                  <div className="absolute top-8 right-5 w-2 h-3 bg-gray-800 rounded-full"></div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-6 h-2 bg-gray-800 rounded-full"></div>
                </div>

                {/* Arms - raised */}
                <div className="absolute top-20 -left-10 w-10 h-28 bg-yellow-300 rounded-full transform -rotate-45 origin-top"></div>
                <div className="absolute top-20 -right-10 w-10 h-28 bg-yellow-300 rounded-full transform rotate-45 origin-top"></div>

                {/* Body */}
                <div className="w-28 h-36 bg-blue-600 rounded-t-full relative z-10"></div>

                {/* Legs */}
                <div className="flex gap-1 -mt-1">
                  <div className="w-12 h-28 bg-orange-500 rounded-b-3xl"></div>
                  <div className="w-12 h-28 bg-orange-500 rounded-b-3xl"></div>
                </div>

                {/* Shoes */}
                <div className="flex gap-1">
                  <div className="w-16 h-6 bg-gray-900 rounded-full"></div>
                  <div className="w-16 h-6 bg-gray-900 rounded-full"></div>
                </div>
              </div>

              {/* Person 2 - Right (orange shirt, jumping) */}
              <div className="relative flex flex-col items-center -mb-12">
                {/* Head with hair */}
                <div className="relative w-20 h-24 mb-2">
                  {/* Hair */}
                  <div className="absolute top-0 left-0 w-20 h-20 bg-gray-900 rounded-full"></div>
                  {/* Face */}
                  <div className="absolute top-8 left-2 w-16 h-16 bg-yellow-300 rounded-full">
                    <div className="absolute top-5 left-3 w-2 h-3 bg-gray-800 rounded-full"></div>
                    <div className="absolute top-5 right-3 w-2 h-3 bg-gray-800 rounded-full"></div>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-6 h-2 bg-gray-800 rounded-full"></div>
                  </div>
                </div>

                {/* Arms - raised */}
                <div className="absolute top-24 -left-12 w-10 h-28 bg-yellow-300 rounded-full transform -rotate-45 origin-top"></div>
                <div className="absolute top-24 -right-12 w-10 h-28 bg-yellow-300 rounded-full transform rotate-45 origin-top"></div>

                {/* Body */}
                <div className="w-28 h-36 bg-orange-500 rounded-t-full relative z-10"></div>

                {/* Legs - jumping pose */}
                <div className="relative flex gap-1 -mt-1">
                  <div className="w-12 h-28 bg-blue-700 rounded-b-3xl"></div>
                  <div className="w-12 h-24 bg-blue-700 rounded-3xl transform rotate-45 translate-y-4"></div>
                </div>

                {/* Shoes */}
                <div className="absolute bottom-0 left-2 flex gap-8">
                  <div className="w-14 h-6 bg-gray-900 rounded-full"></div>
                  <div className="w-14 h-6 bg-gray-900 rounded-full transform translate-x-8 -translate-y-6"></div>
                </div>
              </div>
            </div>

            {/* Ground line */}
            <div className="w-full h-2 bg-teal-400 rounded-full mt-8"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
