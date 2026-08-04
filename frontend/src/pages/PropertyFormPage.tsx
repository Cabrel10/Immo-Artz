import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Upload, X, Image as ImageIcon, ArrowLeft, Save, Eye } from 'lucide-react'
import { propertyService } from '@/services/api'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Textarea'
import { PROPERTY_TYPES, PROPERTY_STANDINGS, TRANSACTION_TYPES, CAMEROON_CITIES, FEATURES_LIST } from '@/types'
import type { PropertyType, PropertyStanding, TransactionType } from '@/types'

interface FormErrors {
  [key: string]: string
}

export function PropertyFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<PropertyType>('apartment')
  const [standing, setStanding] = useState<PropertyStanding>('standard')
  const [transactionType, setTransactionType] = useState<TransactionType>('sale')
  const [price, setPrice] = useState('')
  const [area, setArea] = useState('')
  const [bedrooms, setBedrooms] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parkingSpaces, setParkingSpaces] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('Douala')
  const [quartier, setQuartier] = useState('')
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [status, setStatus] = useState<'draft' | 'published'>('draft')

  // Images
  const [newImages, setNewImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragOver, setDragOver] = useState(false)

  const [errors, setErrors] = useState<FormErrors>({})
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(1)

  // Load existing property for editing
  useEffect(() => {
    if (!isEdit || !id) return
    propertyService.getById(id).then((r) => {
      if (r.data.success && r.data.data?.property) {
        const p = r.data.data.property
        setTitle(p.title)
        setDescription(p.description)
        setType(p.type)
        setStanding(p.standing)
        setTransactionType(p.transaction_type)
        setPrice(String(p.price))
        setArea(String(p.area))
        setBedrooms(p.bedrooms != null ? String(p.bedrooms) : '')
        setBathrooms(p.bathrooms != null ? String(p.bathrooms) : '')
        setParkingSpaces(p.parking_spaces != null ? String(p.parking_spaces) : '')
        setAddress(p.address)
        setCity(p.city)
        setQuartier(p.quartier)
        setSelectedFeatures(p.features ?? [])
        setStatus(p.status === 'published' ? 'published' : 'draft')
        setExistingImages(p.images ?? [])
      }
    }).catch(() => {})
  }, [id, isEdit])

  // Handle file drop / select
  const handleFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files).filter((f) => f.type.startsWith('image/'))
    const total = newImages.length + existingImages.length + arr.length
    if (total > 10) {
      setErrors((p) => ({ ...p, images: 'Maximum 10 images' }))
      return
    }
    const maxSize = 5 * 1024 * 1024
    const oversized = arr.filter((f) => f.size > maxSize)
    if (oversized.length) {
      setErrors((p) => ({ ...p, images: 'Certaines images depassent 5 MB' }))
      return
    }
    setErrors((p) => { const c = { ...p }; delete c.images; return c })
    setNewImages((prev) => [...prev, ...arr])
    arr.forEach((f) => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews((prev) => [...prev, e.target?.result as string])
      reader.readAsDataURL(f)
    })
  }, [newImages, existingImages])

  const removeNewImage = (index: number) => {
    setNewImages((p) => p.filter((_, i) => i !== index))
    setPreviews((p) => p.filter((_, i) => i !== index))
  }

  const removeExistingImage = (url: string) => {
    setExistingImages((p) => p.filter((u) => u !== url))
  }

  const toggleFeature = (f: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]
    )
  }

  const validate = (): boolean => {
    const e: FormErrors = {}
    if (!title.trim()) e.title = 'Titre requis'
    if (!description.trim()) e.description = 'Description requise'
    if (!price || Number(price) <= 0) e.price = 'Prix invalide'
    if (!area || Number(area) <= 0) e.area = 'Surface requise'
    if (!address.trim()) e.address = 'Adresse requise'
    if (!quartier.trim()) e.quartier = 'Quartier requis'
    if (newImages.length === 0 && existingImages.length === 0) e.images = 'Au moins 1 image'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) { setStep(Object.keys(errors).some((k) => ['title', 'description', 'price', 'area'].includes(k)) ? 1 : 2); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', title)
      fd.append('description', description)
      fd.append('type', type)
      fd.append('standing', standing)
      fd.append('transaction_type', transactionType)
      fd.append('price', price)
      fd.append('area', area)
      if (bedrooms) fd.append('bedrooms', bedrooms)
      if (bathrooms) fd.append('bathrooms', bathrooms)
      if (parkingSpaces) fd.append('parking_spaces', parkingSpaces)
      fd.append('address', address)
      fd.append('city', city)
      fd.append('quartier', quartier)
      fd.append('status', status)
      selectedFeatures.forEach((f) => fd.append('features[]', f))
      newImages.forEach((f) => fd.append('images[]', f))
      existingImages.forEach((u) => fd.append('existing_images[]', u))

      if (isEdit && id) {
        fd.append('_method', 'PUT')
        await propertyService.update(id, fd)
      } else {
        await propertyService.create(fd)
      }
      navigate('/agent/dashboard')
    } catch (err: unknown) {
      const axErr = err as { response?: { data?: { errors?: Record<string, string[]>; message?: string } } }
      if (axErr.response?.data?.errors) {
        const apiErrs: FormErrors = {}
        Object.entries(axErr.response.data.errors).forEach(([k, v]) => { apiErrs[k] = Array.isArray(v) ? v[0] : String(v) })
        setErrors(apiErrs)
      }
    }
    setSaving(false)
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-1" /> Retour
      </Button>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? 'Modifier le bien' : 'Ajouter un bien'}
      </h1>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-8">
        {[{ n: 1, l: 'Informations' }, { n: 2, l: 'Localisation & images' }, { n: 3, l: 'Publication' }].map((s) => (
          <button key={s.n} onClick={() => setStep(s.n)}
            className={`flex items-center gap-2 text-sm font-medium pb-2 border-b-2 transition-colors ${step === s.n ? 'border-immo-600 text-immo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <span className={`h-6 w-6 rounded-full text-xs flex items-center justify-center ${step === s.n ? 'bg-immo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>{s.n}</span>
            <span className="hidden sm:inline">{s.l}</span>
          </button>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle>Informations du bien</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input label="Titre" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} placeholder="Ex: Villa 4 chambres Bonapriso" />
            <Textarea label="Description" required value={description} onChange={(e) => setDescription(e.target.value)} error={errors.description} placeholder="Decrivez le bien en detail..." rows={4} />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type *</label>
                <select value={type} onChange={(e) => setType(e.target.value as PropertyType)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  {Object.entries(PROPERTY_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Standing *</label>
                <select value={standing} onChange={(e) => setStanding(e.target.value as PropertyStanding)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  {Object.entries(PROPERTY_STANDINGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction *</label>
                <select value={transactionType} onChange={(e) => setTransactionType(e.target.value as TransactionType)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  {Object.entries(TRANSACTION_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input label="Prix (FCFA) *" type="number" value={price} onChange={(e) => setPrice(e.target.value)} error={errors.price} />
              <Input label="Surface (m2) *" type="number" value={area} onChange={(e) => setArea(e.target.value)} error={errors.area} />
              <Input label="Chambres" type="number" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} />
              <Input label="SdB" type="number" value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} />
            </div>
            <Input label="Places parking" type="number" value={parkingSpaces} onChange={(e) => setParkingSpaces(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Equipements</label>
              <div className="flex flex-wrap gap-2">
                {FEATURES_LIST.map((f) => (
                  <button key={f} type="button" onClick={() => toggleFeature(f)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedFeatures.includes(f) ? 'bg-immo-600 text-white border-immo-600' : 'bg-white text-gray-700 border-gray-300 hover:border-immo-400 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setStep(2)}>Suivant</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle>Localisation & Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville *</label>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
                  {CAMEROON_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <Input label="Quartier *" value={quartier} onChange={(e) => setQuartier(e.target.value)} error={errors.quartier} />
              <Input label="Adresse *" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} />
            </div>

            {/* Dropzone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Images ({existingImages.length + newImages.length}/10) *
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => document.getElementById('fileInput')?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-immo-500 bg-immo-50 dark:bg-immo-900/20' : 'border-gray-300 hover:border-immo-400 dark:border-gray-600'} ${errors.images ? 'border-red-500' : ''}`}>
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Glissez vos images ici ou <span className="text-immo-600 font-medium">parcourir</span></p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WebP - max 5 MB chacune</p>
              </div>
              <input id="fileInput" type="file" multiple accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFiles(e.target.files)} />
              {errors.images && <p className="mt-1 text-sm text-red-600">{errors.images}</p>}
            </div>

            {/* Previews */}
            {(existingImages.length > 0 || previews.length > 0) && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {existingImages.map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="" className="h-24 w-full rounded-lg object-cover" />
                    <button onClick={() => removeExistingImage(url)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt="" className="h-24 w-full rounded-lg object-cover" />
                    <span className="absolute top-1 left-1 bg-green-500 text-white text-[10px] px-1 rounded">NEW</span>
                    <button onClick={() => removeNewImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>Precedent</Button>
              <Button onClick={() => setStep(3)}>Suivant</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <Card>
          <CardHeader><CardTitle>Publication</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <button onClick={() => setStatus('draft')}
                className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${status === 'draft' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <ImageIcon className="h-6 w-6 mx-auto mb-2 text-amber-500" />
                <p className="font-medium">Brouillon</p>
                <p className="text-xs text-gray-500 mt-1">Enregistrer sans publier</p>
              </button>
              <button onClick={() => setStatus('published')}
                className={`flex-1 p-4 rounded-lg border-2 text-center transition-colors ${status === 'published' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                <Eye className="h-6 w-6 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Publier</p>
                <p className="text-xs text-gray-500 mt-1">Visible immédiatement</p>
              </button>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>Precedent</Button>
              <Button onClick={handleSubmit} isLoading={saving} leftIcon={<Save className="h-4 w-4" />}>
                {isEdit ? 'Mettre a jour' : status === 'published' ? 'Publier le bien' : 'Enregistrer le brouillon'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
