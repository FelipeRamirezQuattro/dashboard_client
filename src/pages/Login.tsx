import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Link,
  Logo,
  Separator,
  Spinner,
  cn,
} from "@odessa-separator/ui";
import { ArrowRight, LayoutGrid, Lock, Mail } from "lucide-react";
import { initiateMicrosoftSSO } from "../utils/sso.utils";

const SLIDES = [
  { src: "/slide1.jpg", alt: "Odessa Separator operations" },
  { src: "/slide2.jpg", alt: "Odessa Separator facility" },
  { src: "/slide3.jpg", alt: "Odessa Separator equipment" },
];

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [slideIndex, setSlideIndex] = useState(0);
  const slideTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check for SSO error in URL
    const ssoError = searchParams.get("error");
    const errorDetails = searchParams.get("details");

    if (ssoError) {
      console.log("[Login] SSO Error detected:", ssoError, errorDetails);

      let errorMessage = "Sign-in failed. Please try again.";

      switch (ssoError) {
        case "sso_failed":
          errorMessage =
            "Microsoft sign-in failed. Please try again or use email/password.";
          break;
        case "sso_init_failed":
          errorMessage =
            "Unable to initiate Microsoft sign-in. Please check your connection.";
          break;
        case "sso_auth_failed":
          errorMessage = "Microsoft authentication failed. Please try again.";
          break;
        case "sso_no_user":
          errorMessage = "Unable to authenticate user. Please contact support.";
          break;
        case "sso_callback_failed":
          errorMessage =
            "Authentication callback failed. Please try signing in again.";
          break;
        case "sso_callback_error":
          errorMessage = errorDetails
            ? `Authentication error: ${errorDetails}`
            : "An error occurred during sign-in. Please try again.";
          break;
        case "no_token":
          errorMessage = "Invalid authentication response. Please try again.";
          break;
        default:
          errorMessage = "An unexpected error occurred. Please try again.";
      }

      setError(errorMessage);

      // Clear the error from URL
      navigate("/login", { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    slideTimer.current = setInterval(() => {
      setSlideIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => {
      if (slideTimer.current) clearInterval(slideTimer.current);
    };
  }, []);

  const goToSlide = (i: number) => {
    setSlideIndex(i);
    if (slideTimer.current) clearInterval(slideTimer.current);
    slideTimer.current = setInterval(() => {
      setSlideIndex((idx) => (idx + 1) % SLIDES.length);
    }, 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: unknown) {
      const responseError = (
        err as { response?: { data?: { error?: string } } }
      ).response?.data?.error;
      setError(
        responseError ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftSSO = () => {
    initiateMicrosoftSSO();
  };

  return (
    <div className="flex min-h-screen bg-bg text-text">
      {/* Left: image slider (desktop only) */}
      <div className="relative hidden overflow-hidden lg:block lg:w-1/2 xl:w-3/5">
        {SLIDES.map((slide, i) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={i === slideIndex ? slide.alt : ""}
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 motion-reduce:transition-none"
            style={{ opacity: i === slideIndex ? 1 : 0 }}
          />
        ))}
        <div className="absolute inset-x-0 bottom-6 flex justify-center gap-1">
          {SLIDES.map((_, i) => (
            <Button
              key={i}
              variant="ghost"
              size="icon"
              onClick={() => goToSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === slideIndex ? "true" : undefined}
              className="size-6 bg-transparent hover:bg-transparent"
            >
              <span
                aria-hidden="true"
                className={cn("size-2.5", i === slideIndex ? "bg-accent" : "bg-surface/70")}
              />
            </Button>
          ))}
        </div>
      </div>

      {/* Right: login panel */}
      <div className="flex w-full flex-col items-center justify-center p-8 lg:w-1/2 xl:w-2/5">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <Logo className="h-24 w-auto" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle as="h2">Sign In</CardTitle>
              <CardDescription>Access your separator monitoring dashboard</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {error && (
                <Alert variant="danger">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <Field label="Email Address" required>
                  {(control) => (
                    <InputGroup>
                      <InputGroupAddon>
                        <Mail size={18} aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...control}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="name@company.com"
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </InputGroup>
                  )}
                </Field>

                <Field label="Password" required>
                  {(control) => (
                    <InputGroup>
                      <InputGroupAddon>
                        <Lock size={18} aria-hidden="true" />
                      </InputGroupAddon>
                      <InputGroupInput
                        {...control}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </InputGroup>
                  )}
                </Field>

                <div className="flex items-center justify-between gap-2">
                  <Checkbox
                    label="Remember this device"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                  />
                  <Link href="#" className="text-sm">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Spinner size="sm" label="Signing in" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight size={18} aria-hidden="true" />
                    </>
                  )}
                </Button>
              </form>

              <div className="flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs font-medium tracking-wider text-text-muted uppercase">
                  or continue with
                </span>
                <Separator className="flex-1" />
              </div>

              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleMicrosoftSSO}
                disabled={isLoading}
                className="w-full"
              >
                <LayoutGrid size={18} aria-hidden="true" />
                Sign in with Microsoft
              </Button>
            </CardContent>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-muted">
              © 2026 Odessa Separator Inc. All rights reserved.
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs">
              <Link href="#" variant="subtle">
                Security Policy
              </Link>
              <span aria-hidden="true" className="text-text-muted">
                |
              </span>
              <Link href="#" variant="subtle">
                Help Desk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
