import { Layout } from "@/components/layout";
import { useListPatients, useAddPatient } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Users, ChevronRight, Activity } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function TherapistDashboard() {
  const { data: patients, isLoading, refetch } = useListPatients();
  const addPatientMutation = useAddPatient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const handleAddPatient = async () => {
    if (!name || !email) return;
    try {
      await addPatientMutation.mutateAsync({ data: { name, email } });
      toast({ title: "Patient added successfully" });
      setOpen(false);
      setName("");
      setEmail("");
      refetch();
    } catch (e) {
      toast({ title: "Failed to add patient", variant: "destructive" });
    }
  };

  return (
    <Layout>
      <div className="p-6 pb-24 space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-foreground">Patients</h1>
            <p className="text-muted-foreground">Manage your caseload.</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-12 w-12 p-0 bg-accent text-white shadow-sm hover:opacity-90">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-[2rem]">
              <DialogHeader>
                <DialogTitle>Add New Patient</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Name</label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Patient name"
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Email</label>
                  <Input 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="Patient email" 
                    type="email"
                    className="h-12 rounded-xl"
                  />
                </div>
                <Button 
                  onClick={handleAddPatient} 
                  className="w-full h-12 rounded-xl font-bold"
                  disabled={addPatientMutation.isPending}
                >
                  {addPatientMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : "Add Patient"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </header>

        <div className="space-y-4">
          {patients?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-border space-y-4">
              <Users className="h-12 w-12 text-muted-foreground mx-auto opacity-50" />
              <p className="text-muted-foreground">No patients added yet.</p>
            </div>
          ) : (
            patients?.map((patient) => (
              <Card key={patient.id} className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-[#FFF6D8] text-primary font-bold flex items-center justify-center text-lg uppercase">
                    {patient.name.substring(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{patient.name}</h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Activity className="h-3 w-3" /> 
                        {Math.round(patient.completionPercent)}%
                      </span>
                      <span>•</span>
                      <span>{patient.currentStreak} day streak</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
