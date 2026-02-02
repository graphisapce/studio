import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-headline text-navy dark:text-white">
            Business Dashboard
          </h1>
          <Button>
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Product
          </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <Card>
                <CardHeader>
                <CardTitle>Your Shop Details</CardTitle>
                <CardDescription>
                    This is how customers see your business. Keep it up to date.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Shop editing form will be here.</p>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                <CardTitle>Your Products</CardTitle>
                <CardDescription>Manage your listed products and services.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Product list and management tools will be here.</p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
