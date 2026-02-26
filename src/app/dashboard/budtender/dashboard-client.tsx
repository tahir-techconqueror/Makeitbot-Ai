// src/app/dashboard/budtender/dashboard-client.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Mic, 
    MicOff, 
    MessageSquare, 
    Package, 
    DollarSign, 
    Clock,
    CheckCircle,
    Store,
    Sparkles,
    Loader2
} from 'lucide-react';
import { getBudtenderDashboardData, type BudtenderDashboardData } from './actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function BudtenderDashboardClient() {
    const [data, setData] = useState<BudtenderDashboardData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [chatInput, setChatInput] = useState('');

    useEffect(() => {
        async function loadData() {
            const result = await getBudtenderDashboardData();
            setData(result);
            setIsLoading(false);
        }
        loadData();
    }, []);

    const toggleVoice = () => {
        if (isVoiceMode) {
            setIsListening(false);
            setIsVoiceMode(false);
        } else {
            setIsVoiceMode(true);
            setIsListening(true);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center bg-black">
                <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            </div>
        );
    }

    if (!data?.dispensary) {
        return (
            <div className="max-w-2xl mx-auto py-12 text-center space-y-4 bg-black text-white">
                <Store className="h-16 w-16 mx-auto text-zinc-500" />
                <h2 className="text-2xl font-bold text-blue-400">No Dispensary Linked</h2>
                <p className="text-zinc-400">
                    Ask your manager to add you to their dispensary to unlock the Budtender Co-Pilot.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-24 bg-black text-white">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-blue-400">
                            Budtender Co-Pilot
                        </h1>
                        <Badge className="bg-blue-950/50 text-blue-300 border-blue-800/50">
                            FREE
                        </Badge>
                    </div>
                    <p className="text-zinc-400 flex items-center gap-2 mt-1">
                        <Store className="h-4 w-4" />
                        {data.dispensary.name}
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-950/90 border-zinc-800 backdrop-blur-sm shadow-xl shadow-black/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <Package className="h-8 w-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{data.pendingOrders.length}</p>
                                <p className="text-sm text-zinc-400">Pending Orders</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/90 border-zinc-800 backdrop-blur-sm shadow-xl shadow-black/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">{data.todayStats.ordersCompleted}</p>
                                <p className="text-sm text-zinc-400">Completed Today</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2 bg-zinc-950/90 border-zinc-800 backdrop-blur-sm shadow-xl shadow-black/30">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <DollarSign className="h-8 w-8 text-blue-400" />
                            <div>
                                <p className="text-2xl font-bold text-white">${data.todayStats.revenue.toFixed(0)}</p>
                                <p className="text-sm text-zinc-400">Today's Revenue</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Ember Voice Chat - Main Feature */}
                <Card className="lg:col-span-3 bg-zinc-950/90 border-zinc-800 backdrop-blur-sm shadow-2xl shadow-black/40">
                    <CardHeader className="pb-3 border-b border-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-blue-400" />
                                <CardTitle className="text-lg text-blue-400">Ember - Your AI Co-Pilot</CardTitle>
                            </div>
                            <Badge variant={isVoiceMode ? "default" : "outline"} className="gap-1 bg-zinc-900/70 text-blue-300 border-blue-800/50">
                                {isVoiceMode ? <Mic className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                                {isVoiceMode ? 'Voice' : 'Text'}
                            </Badge>
                        </div>
                        <CardDescription className="text-zinc-400">
                            Ask about products, get recommendations, or look up customer orders
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4 pt-5">
                        {/* Voice Mode UI */}
                        {isVoiceMode ? (
                            <div className="flex flex-col items-center justify-center py-12 space-y-6">
                                <div className={cn(
                                    "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                                    isListening 
                                        ? "bg-blue-950/50 border-blue-500 animate-pulse ring-4 ring-blue-500/30" 
                                        : "bg-zinc-900/70 border-zinc-700"
                                )}>
                                    {isListening ? (
                                        <Mic className="h-12 w-12 text-blue-400" />
                                    ) : (
                                        <MicOff className="h-12 w-12 text-zinc-500" />
                                    )}
                                </div>
                                <p className="text-center text-zinc-400">
                                    {isListening ? "Listening... Say something!" : "Tap to start voice chat"}
                                </p>
                                <div className="flex gap-3">
                                    <Button 
                                        variant={isListening ? "destructive" : "default"}
                                        size="lg"
                                        onClick={() => setIsListening(!isListening)}
                                        className="gap-2 bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-700"
                                    >
                                        {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                        {isListening ? 'Stop' : 'Start Listening'}
                                    </Button>
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsVoiceMode(false)}
                                        className="border-zinc-700 hover:bg-zinc-900 text-zinc-200"
                                    >
                                        Switch to Text
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            // Text Mode UI
                            <div className="space-y-4">
                                <div className="h-64 bg-zinc-900/70 border border-zinc-800 rounded-lg p-4 overflow-y-auto">
                                    <div className="text-center py-8 text-zinc-400">
                                        <Sparkles className="h-8 w-8 mx-auto mb-3 text-blue-400" />
                                        <p>Hey! I'm Ember, your AI co-pilot.</p>
                                        <p className="text-sm mt-2">Ask me about products, recommendations, or customer orders.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Ask Ember anything..."
                                        className="flex-1 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder:text-zinc-500"
                                    />
                                    <Button className="bg-blue-600 hover:bg-blue-500">
                                        Send
                                    </Button>
                                    <Button variant="outline" onClick={() => setIsVoiceMode(true)} className="border-zinc-700 hover:bg-zinc-900">
                                        <Mic className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t border-zinc-800">
                            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-900 text-zinc-200">What's popular today?</Button>
                            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-900 text-zinc-200">Recommend for relaxation</Button>
                            <Button variant="outline" size="sm" className="border-zinc-700 hover:bg-zinc-900 text-zinc-200">High THC options</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Orders */}
                <Card className="lg:col-span-2 bg-zinc-950/90 border-zinc-800 backdrop-blur-sm shadow-2xl shadow-black/40">
                    <CardHeader className="border-b border-zinc-800">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg text-blue-400">Pending Orders</CardTitle>
                            <Badge className="bg-zinc-900/70 text-blue-300 border-blue-800/50">
                                {data.pendingOrders.length}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-5">
                        {data.pendingOrders.length === 0 ? (
                            <p className="text-center text-zinc-500 py-8">
                                No pending orders right now 🎉
                            </p>
                        ) : (
                            data.pendingOrders.slice(0, 5).map(order => (
                                <Link 
                                    key={order.id} 
                                    href={`/scan/${order.id}`}
                                    className="block"
                                >
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 hover:bg-zinc-900/70 transition-colors">
                                        <div>
                                            <p className="font-medium text-white">{order.customerName}</p>
                                            <p className="text-sm text-zinc-400">
                                                {order.itemCount} items • ${order.total.toFixed(2)}
                                            </p>
                                        </div>
                                        <Badge className={cn(
                                            "capitalize bg-zinc-900/70 border-zinc-700 text-zinc-200",
                                            order.status === 'ready' ? 'text-orange-400 border-orange-800/50' :
                                            order.status === 'confirmed' ? 'text-blue-300 border-blue-800/50' : ''
                                        )}>
                                            {order.status}
                                        </Badge>
                                    </div>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
