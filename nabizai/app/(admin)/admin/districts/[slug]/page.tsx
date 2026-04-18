import { redirect } from "next/navigation";

export default function DistrictIndexPage({ params }: { params: { slug: string } }) {
  // Varsayılan olarak Sources sekmesine yönlendir
  redirect(`/admin/districts/${params.slug}/sources`);
}
