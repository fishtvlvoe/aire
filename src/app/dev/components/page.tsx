"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * /dev/components — UI 元件樣態 demo（僅開發用）
 */
export default function ComponentsDemoPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="container mx-auto p-8 space-y-12">
      <header>
        <h1 className="text-3xl font-bold">UI 元件展示</h1>
        <p className="text-muted-foreground">所有 atomic UI 元件樣態</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Button</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="新增">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div>
          <Button disabled>Disabled</Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Input</h2>
        <div className="max-w-sm space-y-2">
          <Input placeholder="請輸入文字" />
          <Input type="email" placeholder="email@example.com" />
          <Input disabled placeholder="disabled" />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Card</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>案件名稱</CardTitle>
            <CardDescription>2026-05-14 建立</CardDescription>
          </CardHeader>
          <CardContent>
            <p>卡片內容範例,可放任意 JSX。</p>
          </CardContent>
          <CardFooter>
            <Button>查看</Button>
          </CardFooter>
        </Card>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Tabs</h2>
        <Tabs defaultValue="a" className="max-w-md">
          <TabsList>
            <TabsTrigger value="a">基本</TabsTrigger>
            <TabsTrigger value="b">進階</TabsTrigger>
            <TabsTrigger value="c">設定</TabsTrigger>
          </TabsList>
          <TabsContent value="a">基本內容</TabsContent>
          <TabsContent value="b">進階內容</TabsContent>
          <TabsContent value="c">設定內容</TabsContent>
        </Tabs>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Dialog</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>開啟 Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>確認操作</DialogTitle>
              <DialogDescription>
                這是 Dialog 元件的描述文字。
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                取消
              </Button>
              <Button onClick={() => setOpen(false)}>確定</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
    </div>
  );
}
