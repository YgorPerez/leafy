"use client";

import { useEffect, useState } from "react";
import { api } from "~/trpc/react";

export function FoodSearch() {
	const [query, setQuery] = useState("");
	const [debouncedQuery, setDebouncedQuery] = useState("");

	const { data: foods, isLoading } = api.food.search.useQuery(
		{ query: debouncedQuery },
		{ enabled: debouncedQuery.length > 2 },
	);

	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedQuery(query);
		}, 500);

		return () => clearTimeout(timer);
	}, [query]);

	return (
		<div className="w-full max-w-2xl space-y-6">
			<div className="group relative">
				<div className="absolute -inset-1 rounded-full bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(30,100%,70%)] opacity-25 blur transition duration-1000 group-focus-within:opacity-50"></div>
				<div className="relative flex items-center">
					<input
						className="w-full rounded-full border border-white/10 bg-black/40 px-8 py-5 text-white text-xl placeholder-white/30 backdrop-blur-xl focus:border-[hsl(280,100%,70%)] focus:outline-none"
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								setDebouncedQuery(query);
							}
						}}
						placeholder="Search for organic foods, snacks, drinks..."
						type="text"
						value={query}
					/>
					<button
						className="absolute right-3 rounded-full bg-gradient-to-r from-[hsl(280,100%,70%)] to-[hsl(30,100%,70%)] px-8 py-3 font-bold text-white shadow-lg transition hover:scale-105 active:scale-95"
						onClick={() => setDebouncedQuery(query)}
					>
						Search
					</button>
				</div>
			</div>

			<div className="min-h-[100px]">
				{isLoading && (
					<div className="flex items-center justify-center py-8">
						<div className="h-8 w-8 animate-spin rounded-full border-white border-b-2"></div>
					</div>
				)}

				{foods && foods.length > 0 && (
					<ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
						{foods.map((food) => (
							<li
								className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-5 transition-all hover:border-white/20 hover:bg-white/10"
								key={food.code}
							>
								<div>
									<div className="font-bold text-lg text-white transition-colors group-hover:text-[hsl(280,100%,70%)]">
										{food.product_name || "Unknown Product"}
									</div>
									<div className="mt-1 line-clamp-1 text-sm text-white/50">
										{food.brands || "No brand"} •{" "}
										{food.categories || "Uncategorized"}
									</div>
								</div>
								{food.nutriscore_grade && (
									<div className="mt-4 flex items-center gap-2">
										<span
											className={`rounded-md px-3 py-1 font-bold text-sm uppercase ${
												food.nutriscore_grade === "a"
													? "bg-green-500 text-white"
													: food.nutriscore_grade === "b"
														? "bg-lime-500 text-white"
														: food.nutriscore_grade === "c"
															? "bg-yellow-500 text-black"
															: food.nutriscore_grade === "d"
																? "bg-orange-500 text-white"
																: food.nutriscore_grade === "e"
																	? "bg-red-500 text-white"
																	: "bg-gray-500 text-white"
											}`}
										>
											Nutri-Score {food.nutriscore_grade}
										</span>
									</div>
								)}
							</li>
						))}
					</ul>
				)}

				{foods && foods.length === 0 && debouncedQuery && !isLoading && (
					<div className="rounded-2xl border-2 border-white/10 border-dashed py-12 text-center">
						<p className="font-medium text-white/50 text-xl">
							No results found for "{debouncedQuery}"
						</p>
						<p className="mt-2 text-white/30">
							Try searching for something else
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
