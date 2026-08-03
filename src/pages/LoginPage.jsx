import googleIcon from "../assets/google.svg";
import { Calendar } from "lucide-react";

export default function LoginPage({
  onGoogleLogin,
  error = "",
  checking = false,
}) {
  return (
    <main className="app-shell mx-auto h-[min(874px,100dvh)] w-full max-w-[402px] overflow-hidden bg-white shadow-xl">
      <div className="login-page my-courses-page relative h-full overflow-hidden">
        <div className="login-content my-courses-content flex h-full flex-col items-center justify-center px-6 text-center">

          <div className="w-16 h-16 rounded-2xl border-2 border-purple-600 flex items-center justify-center mb-6">
            <Calendar className="text-purple-600" size={28} />
          </div>

          <h1 className="text-2xl font-bold mb-2">간단하게 시작해요</h1>

          <p className="text-gray-500 mb-10">
            소셜 계정으로 3초 만에 시작하기
          </p>

          <button
            onClick={onGoogleLogin}
            disabled={checking}
            className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-gray-200 py-3 disabled:cursor-wait disabled:opacity-60"
          >
            <img src={googleIcon} alt="Google" className="w-5 h-5" />
            <span className="font-medium">
              {checking ? "로그인 상태 확인 중..." : "Google로 시작하기"}
            </span>
          </button>

          {error && (
            <p
              role="alert"
              className="mt-4 w-full max-w-xs rounded-lg bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-600"
            >
              {error}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-8">
            가입 시 이용약관 및 개인정보처리방침에 동의합니다
          </p>

        </div>
      </div>
    </main>
  );
}
