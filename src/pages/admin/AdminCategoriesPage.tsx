// Bu dosya, admin panelinde kategori listeleme, oluşturma, düzenleme ve aktif/pasif yönetimini içerir.
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  activateCategory,
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from '@/api/admin';
import { extractArray } from '@/api/axios';
import type { Category, CategoryRequest } from '@/types/admin';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DataTable,
  EmptyState,
  getErrorMessage,
  LoadingState,
  StatusBadge,
} from '@/pages/admin/adminUtils';

const categorySchema = z.object({
  name: z.string().min(2, 'Ad en az 2 karakter olmalı.'),
  slug: z
    .string()
    .min(2, 'Slug en az 2 karakter olmalı.')
    .regex(/^[a-z-]+$/, 'Slug sadece küçük harf ve tire içerebilir.'),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int('Sıra tam sayı olmalı.').default(0),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

function toFormValues(category?: Category): CategoryFormValues {
  return {
    name: category?.name ?? '',
    slug: category?.slug ?? '',
    description: category?.description ?? '',
    sortOrder: category?.sortOrder ?? 0,
  };
}

function toCategoryRequest(values: CategoryFormValues): CategoryRequest {
  return {
    name: values.name.trim(),
    slug: values.slug.trim(),
    description: values.description?.trim() || undefined,
    sortOrder: values.sortOrder,
  };
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Category | null>(null);

  const form = useForm<CategoryFormValues>({
    defaultValues: toFormValues(),
  });

  const categoriesQuery = useQuery({
    queryKey: ['adminCategories'],
    queryFn: getCategories,
  });

  useEffect(() => {
    if (isFormOpen) {
      form.reset(toFormValues(editingCategory ?? undefined));
    }
  }, [editingCategory, form, isFormOpen]);

  const invalidateCategories = () => {
    void queryClient.invalidateQueries({ queryKey: ['adminCategories'] });
  };

  const saveMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const payload = toCategoryRequest(values);
      if (editingCategory) {
        return updateCategory(editingCategory.id, payload);
      }
      return createCategory(payload);
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Kategori güncellendi' : 'Kategori oluşturuldu');
      setIsFormOpen(false);
      setEditingCategory(null);
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kategori kaydedilemedi.'));
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (category: Category) =>
      category.isActive
        ? deactivateCategory(category.id)
        : activateCategory(category.id),
    onSuccess: (response) => {
      toast.success(response.data.isActive ? 'Kategori aktifleştirildi' : 'Kategori pasifleştirildi');
      setToggleTarget(null);
      invalidateCategories();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'Kategori durumu güncellenemedi.'));
    },
  });

  const handleSubmit = (values: CategoryFormValues) => {
    const result = categorySchema.safeParse(values);
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        const field = issue.path[0];
        if (
          field === 'name' ||
          field === 'slug' ||
          field === 'description' ||
          field === 'sortOrder'
        ) {
          form.setError(field, { message: issue.message });
        }
      });
      return;
    }
    saveMutation.mutate(result.data);
  };

  const categories = useMemo(() => {
    return extractArray<Category>(categoriesQuery.data?.data).sort(
      (first, second) => first.sortOrder - second.sortOrder,
    );
  }, [categoriesQuery.data?.data]);

  const columns = useMemo<ColumnDef<Category>[]>(
    () => [
      {
        accessorKey: 'sortOrder',
        header: 'Sıra',
      },
      {
        accessorKey: 'name',
        header: 'Ad',
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: 'slug',
        header: 'Slug',
      },
      {
        accessorKey: 'isActive',
        header: 'Durum',
        cell: ({ row }) => (
          <StatusBadge tone={row.original.isActive ? 'green' : 'red'}>
            {row.original.isActive ? 'Aktif' : 'Pasif'}
          </StatusBadge>
        ),
      },
      {
        id: 'actions',
        header: 'İşlemler',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setEditingCategory(row.original);
                setIsFormOpen(true);
              }}
            >
              Düzenle
            </Button>
            <Button
              type="button"
              size="sm"
              variant={row.original.isActive ? 'destructive' : 'outline'}
              className={
                row.original.isActive
                  ? undefined
                  : 'border-green-300 bg-green-50 text-green-800 hover:bg-green-100'
              }
              onClick={() => setToggleTarget(row.original)}
            >
              {row.original.isActive ? 'Pasifleştir' : 'Aktifleştir'}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
        <Button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
        >
          Yeni Kategori
        </Button>
      </div>

      {categoriesQuery.isLoading && (
        <LoadingState label="Kategoriler yükleniyor..." />
      )}

      {categoriesQuery.isError && (
        <p className="text-sm text-destructive" role="alert">
          {getErrorMessage(
            categoriesQuery.error,
            'Kategoriler yüklenirken bir hata oluştu.',
          )}
        </p>
      )}

      {!categoriesQuery.isLoading &&
        !categoriesQuery.isError &&
        categories.length === 0 && (
          <EmptyState message="Henüz kategori bulunamadı." />
        )}

      {!categoriesQuery.isLoading &&
        !categoriesQuery.isError &&
        categories.length > 0 && (
          <Card>
            <CardContent className="p-0">
              <DataTable data={categories} columns={columns} />
            </CardContent>
          </Card>
        )}

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) {
            setEditingCategory(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
            <DialogDescription>
              Kategori bilgilerini doldurup kaydedin.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <div className="space-y-2">
              <Label htmlFor="category-name">Ad</Label>
              <Input id="category-name" {...form.register('name')} />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-slug">Slug</Label>
              <Input id="category-slug" {...form.register('slug')} />
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-description">Açıklama</Label>
              <Textarea
                id="category-description"
                {...form.register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category-sort-order">Sıra</Label>
              <Input
                id="category-sort-order"
                type="number"
                {...form.register('sortOrder', { valueAsNumber: true })}
              />
              {form.formState.errors.sortOrder && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.sortOrder.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                İptal
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={toggleTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setToggleTarget(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.isActive
                ? 'Kategoriyi pasifleştir'
                : 'Kategoriyi aktifleştir'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu işlem kategori durumunu değiştirecek. Devam etmek istiyor musunuz?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              disabled={toggleMutation.isPending}
              onClick={() => {
                if (toggleTarget) {
                  toggleMutation.mutate(toggleTarget);
                }
              }}
            >
              Onayla
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
