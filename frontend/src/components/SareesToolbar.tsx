"use client";

import { useRouter, useSearchParams } from "next/navigation";

type SareesToolbarProps = {
  count: number;
  sort: string;
};

export default function SareesToolbar({
  count,
  sort,
}: SareesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSortChange(
    event: React.ChangeEvent<HTMLSelectElement>
  ) {
    const value = event.target.value;

    const params = new URLSearchParams(
      searchParams.toString()
    );

    if (value === "recommended") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }

    const query = params.toString();

    router.push(
      query
        ? `/sarees?${query}`
        : "/sarees"
    );
  }

  return (
    <div className="toolbar">
      <span>
        {count} {count === 1 ? "piece" : "pieces"}
      </span>

      <select
        value={sort}
        onChange={handleSortChange}
        aria-label="Sort sarees"
      >
        <option value="recommended">
          Recommended
        </option>

        <option value="newest">
          Newest
        </option>

        <option value="low">
          Price: Low to High
        </option>

        <option value="high">
          Price: High to Low
        </option>
      </select>
    </div>
  );
}