
"use client"

import { useState, useEffect } from "react"
import { PlusCircle, Trash2, Edit, CheckCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

type ApiConfig = {
  id: string
  name: string
  url: string
}

export default function SettingsPage() {
  const [apiList, setApiList] = useState<ApiConfig[]>([])
  const [activeApiUrl, setActiveApiUrl] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingApi, setEditingApi] = useState<ApiConfig | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadApiConfigs()
  }, [])

  const loadApiConfigs = () => {
    setIsLoading(true)
    const storedList = localStorage.getItem("apiList")
    const storedActiveUrl = localStorage.getItem("activeApiUrl")
    if (storedList) {
      setApiList(JSON.parse(storedList))
    }
    setActiveApiUrl(storedActiveUrl)
    setIsLoading(false)
  }

  const saveApiConfigs = (list: ApiConfig[], activeUrl: string | null) => {
    localStorage.setItem("apiList", JSON.stringify(list))
    if (activeUrl) {
        localStorage.setItem("activeApiUrl", activeUrl)
    } else {
        localStorage.removeItem("activeApiUrl")
    }
    setApiList(list)
    setActiveApiUrl(activeUrl)
  }

  const openAddDialog = () => {
    setEditingApi(null)
    setName("")
    setUrl("")
    setIsDialogOpen(true)
  }

  const openEditDialog = (api: ApiConfig) => {
    setEditingApi(api)
    setName(api.name)
    setUrl(api.url)
    setIsDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    const newApiList = apiList.filter((api) => api.id !== id)
    let newActiveUrl = activeApiUrl
    if (activeApiUrl === apiList.find(api => api.id === id)?.url) {
        newActiveUrl = newApiList.length > 0 ? newApiList[0].url : null
    }
    saveApiConfigs(newApiList, newActiveUrl)
    toast({
        title: "สำเร็จ",
        description: "ลบเซิร์ฟเวอร์เรียบร้อยแล้ว",
    })
  }

  const handleSave = () => {
    if (!name || !url) {
      toast({
        title: "ข้อผิดพลาด",
        description: "กรุณากรอกข้อมูลให้ครบถ้วน",
        variant: "destructive",
      })
      return
    }

    let newApiList
    if (editingApi) {
      newApiList = apiList.map((api) =>
        api.id === editingApi.id ? { ...api, name, url } : api
      )
    } else {
      newApiList = [...apiList, { id: Date.now().toString(), name, url }]
    }
    
    let newActiveApiUrl = activeApiUrl
    if (!newActiveApiUrl && newApiList.length > 0) {
        newActiveApiUrl = newApiList[0].url
    }
    if (editingApi && editingApi.url === activeApiUrl) {
        newActiveApiUrl = url;
    }


    saveApiConfigs(newApiList, newActiveApiUrl)
    toast({
      title: "สำเร็จ",
      description: "บันทึกข้อมูลเซิร์ฟเวอร์เรียบร้อยแล้ว",
    })
    setIsDialogOpen(false)
  }
  
  const handleSetActive = (url: string) => {
    saveApiConfigs(apiList, url);
    toast({
        title: "สำเร็จ",
        description: "เลือกเซิร์ฟเวอร์ใช้งานหลักแล้ว"
    })
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">จัดการเซิร์ฟเวอร์</h1>
          <p className="text-muted-foreground">
            เพิ่ม แก้ไข หรือลบ API เซิร์ฟเวอร์ของคุณ
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <PlusCircle className="mr-2 h-4 w-4" />
          เพิ่มเซิร์ฟเวอร์
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รายการเซิร์ฟเวอร์</CardTitle>
          <CardDescription>
            เซิร์ฟเวอร์ทั้งหมดที่คุณได้เชื่อมต่อไว้
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>กำลังโหลด...</p>
          ) : apiList.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <p>ยังไม่มีเซิร์ฟเวอร์</p>
              <p className="text-sm">กดปุ่ม "เพิ่มเซิร์ฟเวอร์" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiList.map((api) => (
                <Card key={api.id} className={`p-4 flex justify-between items-center ${activeApiUrl === api.url ? 'border-primary' : ''}`}>
                  <div className="flex items-center gap-4">
                     {activeApiUrl === api.url && <CheckCircle className="h-5 w-5 text-green-500" />}
                    <div>
                        <p className="font-semibold">{api.name}</p>
                        <p className="text-sm text-muted-foreground">{api.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                     {activeApiUrl !== api.url && (
                        <Button variant="outline" size="sm" onClick={() => handleSetActive(api.url)}>
                            เลือกใช้งาน
                        </Button>
                     )}
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(api)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(api.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingApi ? "แก้ไขเซิร์ฟเวอร์" : "เพิ่มเซิร์ฟเวอร์ใหม่"}</DialogTitle>
            <DialogDescription>
              กรอกชื่อและ URL ของเซิร์ฟเวอร์ที่คุณต้องการเชื่อมต่อ
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                ชื่อ
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                placeholder="เช่น เซิร์ฟเวอร์หลัก"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="url" className="text-right">
                URL
              </Label>
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://your-api-url.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleSave}>บันทึก</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
