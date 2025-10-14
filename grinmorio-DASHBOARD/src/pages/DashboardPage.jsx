// DashboardPage.jsx
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { logout, getUser } from "@/lib/auth";
import { useNavigate } from "react-router-dom";

export default function DashboardPage() {
    const navigate = useNavigate();
    const user = getUser();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="h-screen w-screen flex flex-col bg-[#1a1a1a] text-white">
            <header className="bg-[#2b2b2b] border-b border-[#404040] shadow-lg z-10 flex items-center justify-between px-6 h-16">
                 <h1 className="text-xl font-bold text-white">Painel de Controle Grinmório</h1>
                 <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-300">
                        Bem-vindo, <span className="text-white font-medium">{user?.username}</span>
                        <span className="ml-2 px-2.5 py-0.5 bg-[#3a3a3a] text-xs rounded text-gray-300 border border-[#404040]">
                            {user?.role}
                        </span>
                    </span>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleLogout}
                        className="bg-transparent border-[#404040] text-gray-300 hover:bg-[#3a3a3a] hover:text-white hover:border-gray-500 h-9"
                    >
                        Logout
                    </Button>
                 </div>
            </header>

            <main className="flex-1 overflow-hidden">
                <Tabs defaultValue={user?.role === 'admin' ? 'portainer' : 'mongo'} className="h-full w-full flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 bg-[#2b2b2b] border-b border-[#404040] rounded-none h-12 gap-0">
                        {user?.role === 'admin' && (
                            <TabsTrigger 
                                value="portainer"
                                className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-gray-400 hover:text-gray-300 hover:bg-[#3a3a3a] rounded-none transition-colors"
                            >
                                Docker (Portainer)
                            </TabsTrigger>
                        )}
                        <TabsTrigger 
                            value="mongo"
                            className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-gray-400 hover:text-gray-300 hover:bg-[#3a3a3a] rounded-none transition-colors"
                        >
                            MongoDB
                        </TabsTrigger>
                        <TabsTrigger 
                            value="redis"
                            className="data-[state=active]:bg-[#1a1a1a] data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-white text-gray-400 hover:text-gray-300 hover:bg-[#3a3a3a] rounded-none transition-colors"
                        >
                            Redis
                        </TabsTrigger>
                    </TabsList>

                    {user?.role === 'admin' && (
                        <TabsContent value="portainer" className="flex-1 overflow-hidden m-0 p-0">
                            <iframe 
                              src="/portainer/" 
                              className="w-full h-full border-0" 
                              title="Portainer"
                            ></iframe>
                        </TabsContent>
                    )}
                    <TabsContent value="mongo" className="flex-1 overflow-hidden m-0 p-0">
                        <iframe 
                          src="http://localhost:8081" 
                          className="w-full h-full border-0" 
                          title="Mongo Express"
                        ></iframe>
                    </TabsContent>
                    <TabsContent value="redis" className="flex-1 overflow-hidden m-0 p-0">
                        <iframe 
                          src="http://localhost:8082" 
                          className="w-full h-full border-0" 
                          title="Redis Commander"
                        ></iframe>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}