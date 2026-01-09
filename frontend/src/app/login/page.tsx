"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Loader2, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Login failed");
            }

            // Store tokens
            localStorage.setItem("accessToken", result.accessToken);
            localStorage.setItem("refreshToken", result.refreshToken);
            localStorage.setItem("user", JSON.stringify(result.user));

            toast.success("Welcome back!");
            router.push("/chat");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Login failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f0d17] flex items-center justify-center p-4">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/10 via-transparent to-purple-600/10 pointer-events-none" />

            <Card className="w-full max-w-md bg-[#1a1625] border-[#252033] relative z-10">
                <CardHeader className="space-y-4 text-center">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center justify-center gap-2 mx-auto">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                            <Play className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="text-2xl font-bold font-['Outfit'] text-white">CinePal</span>
                    </Link>
                    <div>
                        <CardTitle className="text-2xl font-['Outfit'] text-white">Welcome back</CardTitle>
                        <CardDescription className="text-[#a09dab]">
                            Sign in to continue your entertainment journey
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm text-[#a09dab]">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6873]" />
                                <Input
                                    {...register("email")}
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-10 bg-[#252033] border-[#252033] text-white placeholder:text-[#6b6873] focus:border-violet-500 focus:ring-violet-500"
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-400">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm text-[#a09dab]">Password</label>
                                <Link href="/forgot-password" className="text-sm text-violet-400 hover:text-violet-300">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b6873]" />
                                <Input
                                    {...register("password")}
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10 bg-[#252033] border-[#252033] text-white placeholder:text-[#6b6873] focus:border-violet-500 focus:ring-violet-500"
                                />
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-400">{errors.password.message}</p>
                            )}
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-violet-600 hover:bg-violet-500 text-white py-5"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign in"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-[#a09dab]">
                            Don&apos;t have an account?{" "}
                            <Link href="/register" className="text-violet-400 hover:text-violet-300 font-medium">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
