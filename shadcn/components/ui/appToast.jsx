import toast from "react-hot-toast";
import { 
  CheckCircle2, 
  XCircle, 
  Info, 
  AlertTriangle, 
  Loader2, 
  Receipt,
  X
} from "lucide-react";
import logo from "../../../src/assets/logo.png";

/** 
 * Premium Custom Toast Component
 * Features: Type-specific gradients, logo, animated progress bar, smooth transitions
 */
const CustomToast = ({ t, title, description, icon, gradientClass, iconBgClass }) => (
  <div
    className={`${
      t.visible ? "animate-enter" : "animate-leave"
    } relative overflow-hidden max-w-md w-full ${gradientClass} shadow-2xl rounded-2xl pointer-events-auto ring-1 ring-black/5 backdrop-blur-sm`}
  >
    {/* Main Content */}
    <div className="flex items-center gap-3 p-4 pr-12">
      {/* Logo/Brand Icon - Left */}
      <div className="flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg">
          <span className="text-xl font-bold text-white">

            <img src={logo} alt="Logo" />
          </span>
        </div>
      </div>

      {/* Text Content - Middle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white tracking-tight">
          {title}
        </p>
        {description && (
          <p className="mt-0.5 text-xs text-white/80 line-clamp-2">
            {description}
          </p>
        )}
      </div>

      {/* Status Icon - Right of Text */}
      <div className="flex-shrink-0">
        <div className={`w-8 h-8 rounded-lg ${iconBgClass} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>

    {/* Close Button - Top Right */}
    <button
      onClick={() => toast.dismiss(t.id)}
      className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 group"
      aria-label="Close notification"
    >
      <X size={14} className="text-white/70 group-hover:text-white transition-colors" />
    </button>

    {/* Animated Progress Bar - Only show when visible */}
    {t.visible && (
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10">
        <div 
          className="h-full bg-white/40 rounded-full"
          style={{
            animation: `toast-progress ${t.duration || 4000}ms linear forwards`
          }}
        />
      </div>
    )}
  </div>
);

// Gradient configurations for each toast type
const toastStyles = {
  success: {
    gradient: "bg-gradient-to-tl from-emerald-600 to-green-600",
    iconBg: "bg-white/25"
  },
  error: {
    gradient: "bg-gradient-to-br from-red-500 to-red-600",
    iconBg: "bg-white/25"
  },
  info: {
    gradient: "bg-gradient-to-br from-blue-500 to-sky-600",
    iconBg: "bg-white/25"
  },
  warning: {
    gradient: "bg-linear-to-tl from-yellow-400 to-amber-600",
    iconBg: "bg-white/25"
  },
  invoice: {
    gradient: "bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700",
    iconBg: "bg-white/25"
  },
  theme: {
    gradient: "bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700",
    iconBg: "bg-white/25"
  },
   loading: { // ✅ Added missing loading style
    gradient: "bg-gradient-to-br from-slate-600 to-gray-600",
    iconBg: "bg-white/25"
  },
};

const toastConfig = {
  duration: 4000,
  // Remove the toast from DOM immediately after animation
  style: {
    maxWidth: '28rem'
  }
};

export const appToast = {
  success: (title, description) => toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={title} 
      description={description} 
      gradientClass={toastStyles.success.gradient}
      iconBgClass={toastStyles.success.iconBg}
      icon={<CheckCircle2 size={18} className="text-white" strokeWidth={2.5} />} 
    />
  ), { ...toastConfig }),

  error: (title, description = "Something went wrong") => toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={title} 
      description={description} 
      gradientClass={toastStyles.error.gradient}
      iconBgClass={toastStyles.error.iconBg}
      icon={<XCircle size={18} className="text-white" strokeWidth={2.5} />} 
    />
  ), { ...toastConfig, duration: 5000 }),

  info: (title, description) => toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={title} 
      description={description} 
      gradientClass={toastStyles.info.gradient}
      iconBgClass={toastStyles.info.iconBg}
      icon={<Info size={18} className="text-white" strokeWidth={2.5} />} 
    />
  ), { ...toastConfig }),

  warning: (title, description) => toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={title} 
      description={description} 
      gradientClass={toastStyles.warning.gradient}
      iconBgClass={toastStyles.warning.iconBg}
      icon={<AlertTriangle size={18} className="text-white" strokeWidth={2.5} />} 
    />
  ), { ...toastConfig, duration: 4500 }),

  invoice: (title, description) => toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={title} 
      description={description} 
      gradientClass={toastStyles.invoice.gradient}
      iconBgClass={toastStyles.invoice.iconBg}
      icon={<Receipt size={18} className="text-white" strokeWidth={2.5} />} 
    />
  ), { ...toastConfig }),

  /**
   * Promise wrapper with loading, success, and error states
   */
  /**
 * Promise wrapper with loading, success, and error states
 */
promise: async (promise, messages = {}, options = {}) => {
  const toastId = toast.custom((t) => (
    <CustomToast 
      t={t} 
      title={messages.loading || "Processing..."} 
      description="Please wait a moment" 
      gradientClass={toastStyles.loading.gradient}
      iconBgClass={toastStyles.loading.iconBg}
      icon={<Loader2 size={18} className="text-white animate-spin" strokeWidth={2.5} />} 
    />
  ), { duration: Infinity });

  try {
    const result = await promise;
    toast.dismiss(toastId);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      // Use custom type if provided, otherwise default to success
      const toastType = options.successType || 'success';
      const toastMethod = appToast[toastType] || appToast.success;
      
      toastMethod(
        typeof messages.success === "string" ? messages.success : "Success!",
        typeof messages.successDescription === "string" ? messages.successDescription : ""
      );
    }, 100);
    return result;
  } catch (err) {
    toast.dismiss(toastId);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      appToast.error(
        typeof messages.error === "string" ? messages.error : "Error",
        err?.message || "An unexpected error occurred"
      );
    }, 100);
    throw err;
  }
}
};