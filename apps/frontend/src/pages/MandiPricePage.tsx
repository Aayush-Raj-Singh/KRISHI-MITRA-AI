import React, { useMemo, useState } from "react";
import {
  Alert,
  alpha,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import AgricultureHero from "../components/common/AgricultureHero";
import AppLayout from "../components/common/AppLayout";
import FilterAutocomplete from "../components/common/FilterAutocomplete";
import useMandiFilterOptions from "../hooks/useMandiFilterOptions";
import { fetchMarketPriceTable, type MarketPriceTableFilters } from "../services/dashboard";

interface MandiPriceContentProps {
  embedded?: boolean;
}

const DEFAULT_PAGE_SIZE = 10;

const createDefaultFilters = (): MarketPriceTableFilters => ({
  page: 1,
  page_size: DEFAULT_PAGE_SIZE,
});

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(value)}/qt`;

const formatDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("en-GB").format(parsed);
};

const MandiPriceHeader: React.FC<{ embedded: boolean }> = ({ embedded }) => {
  const { t } = useTranslation();

  if (!embedded) {
    return (
      <AgricultureHero
        icon={<StorefrontIcon color="primary" />}
        logoSrc="/assets/logo/krishimitra-ai-icon-transparent.png"
        title={t("dashboard.price", { defaultValue: "Mandi Price" })}
        subtitle="District-first mandi price search with recent market rows, trading dates, and per-quintal price bands."
        badges={["District search", "Market rows", "Date filters", "Price bands"]}
        imageSrc="/assets/agri-slider/slide-10.jpg"
      />
    );
  }

  return (
    <Paper
      sx={{
        p: { xs: 2, md: 2.4 },
        borderRadius: 3,
        border: "1px solid rgba(31,84,50,0.12)",
        background:
          "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
      }}
    >
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800 }}>
            {t("dashboard.price", { defaultValue: "Mandi Price" })}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            Search recent mandi market rows the same way traders scan district, market, commodity,
            and date windows.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="flex-start">
          <Chip label="District search" size="small" color="primary" />
          <Chip label="Market rows" size="small" variant="outlined" />
          <Chip label="Price bands" size="small" variant="outlined" />
        </Stack>
      </Stack>
    </Paper>
  );
};

export const MandiPriceContent: React.FC<MandiPriceContentProps> = ({ embedded = false }) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const mandiOptions = useMandiFilterOptions();
  const [draftFilters, setDraftFilters] = useState<MarketPriceTableFilters>(() =>
    createDefaultFilters(),
  );
  const [appliedFilters, setAppliedFilters] = useState<MarketPriceTableFilters>(() =>
    createDefaultFilters(),
  );

  const districtOptions = mandiOptions.districts;
  const marketOptions = draftFilters.district
    ? mandiOptions.getMandisForDistrictAcrossStates(draftFilters.district)
    : mandiOptions.markets;

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["market-price-table", appliedFilters],
    queryFn: () => fetchMarketPriceTable(appliedFilters),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const page = (data?.page || appliedFilters.page || 1) - 1;
  const pageSize = data?.page_size || appliedFilters.page_size || DEFAULT_PAGE_SIZE;

  const activeFilterChips = useMemo(
    () =>
      [
        appliedFilters.district ? `District: ${appliedFilters.district}` : null,
        appliedFilters.mandi ? `Market: ${appliedFilters.mandi}` : null,
        appliedFilters.commodity ? `Commodity: ${appliedFilters.commodity}` : null,
      ].filter(Boolean) as string[],
    [appliedFilters.commodity, appliedFilters.district, appliedFilters.mandi],
  );
  const hasInvalidDateRange =
    Boolean(draftFilters.date_from) &&
    Boolean(draftFilters.date_to) &&
    String(draftFilters.date_from) > String(draftFilters.date_to);

  const handleFilterChange = (key: keyof MarketPriceTableFilters, value: string) => {
    const nextValue = value.trim();
    setDraftFilters((prev) => {
      const next: MarketPriceTableFilters = { ...prev, [key]: nextValue || undefined };
      if (key === "district" && prev.district !== nextValue) {
        next.mandi = undefined;
      }
      return next;
    });
  };

  const handleDateChange = (key: "date_from" | "date_to", value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value || undefined }));
  };

  const handleSearch = () => {
    setAppliedFilters({
      ...draftFilters,
      page: 1,
      page_size: appliedFilters.page_size || DEFAULT_PAGE_SIZE,
    });
  };

  const handleReset = () => {
    const nextFilters = createDefaultFilters();
    setDraftFilters(nextFilters);
    setAppliedFilters(nextFilters);
  };

  const handlePageChange = (_event: unknown, nextPage: number) => {
    setAppliedFilters((prev) => ({
      ...prev,
      page: nextPage + 1,
      page_size: prev.page_size || DEFAULT_PAGE_SIZE,
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPageSize = Number(event.target.value) || DEFAULT_PAGE_SIZE;
    setAppliedFilters((prev) => ({
      ...prev,
      page: 1,
      page_size: nextPageSize,
    }));
    setDraftFilters((prev) => ({
      ...prev,
      page: 1,
      page_size: nextPageSize,
    }));
  };

  return (
    <Stack spacing={3}>
      <MandiPriceHeader embedded={embedded} />

      <Paper
        sx={{
          p: { xs: 2, md: 2.6 },
          borderRadius: 3,
          border: "1px solid rgba(31,84,50,0.12)",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(247,250,245,0.98) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Grid container spacing={1.8}>
            <Grid item xs={12} md={2}>
              <FilterAutocomplete
                label={t("filters.district", { defaultValue: "District" })}
                value={draftFilters.district || ""}
                options={districtOptions}
                onChange={(value) => handleFilterChange("district", value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FilterAutocomplete
                label={t("filters.mandi", { defaultValue: "Market" })}
                value={draftFilters.mandi || ""}
                options={marketOptions}
                onChange={(value) => handleFilterChange("mandi", value)}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <FilterAutocomplete
                label={t("filters.commodity", { defaultValue: "Crop/Commodity" })}
                value={draftFilters.commodity || ""}
                options={mandiOptions.commodities}
                onChange={(value) => handleFilterChange("commodity", value)}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={t("filters.from_date", { defaultValue: "From Date" })}
                type="date"
                value={draftFilters.date_from || ""}
                onChange={(event) => handleDateChange("date_from", event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                label={t("filters.to_date", { defaultValue: "To Date" })}
                type="date"
                value={draftFilters.date_to || ""}
                onChange={(event) => handleDateChange("date_to", event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Stack direction={{ xs: "row", md: "column" }} spacing={1} sx={{ height: "100%" }}>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  startIcon={<RestartAltIcon />}
                  sx={{ minHeight: 54, minWidth: 110 }}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={hasInvalidDateRange}
                  startIcon={<SearchIcon />}
                  sx={{
                    minHeight: 54,
                    minWidth: 110,
                    bgcolor: "#f4c400",
                    color: "#1b1b1b",
                    "&:hover": { bgcolor: "#ddb000" },
                  }}
                >
                  Search
                </Button>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between">
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {activeFilterChips.length > 0 ? (
                activeFilterChips.map((label) => <Chip key={label} label={label} size="small" />)
              ) : (
                <Chip
                  label="Showing latest approved mandi rows"
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              )}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {data?.generated_at
                ? `Last synced ${new Date(data.generated_at).toLocaleString()}`
                : "Ready to search mandi rows"}
            </Typography>
          </Stack>

          {hasInvalidDateRange ? (
            <Alert severity="warning">From Date must be on or before To Date.</Alert>
          ) : null}
        </Stack>
      </Paper>

      {error && (
        <Alert severity="error">
          {t("common.request_failed", { defaultValue: "Unable to load mandi prices right now." })}
        </Alert>
      )}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          border: "1px solid rgba(31,84,50,0.12)",
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(245,249,242,0.98) 100%)",
        }}
      >
        <Stack spacing={0}>
          <Box
            sx={{
              px: { xs: 2, md: 3 },
              py: 2,
              borderBottom: "1px solid rgba(31,84,50,0.1)",
            }}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.2}
              justifyContent="space-between"
            >
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800 }}>
                  Market Price
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  District-wise mandi price rows with modal, minimum, and maximum bands.
                </Typography>
              </Box>
              <Chip
                label={`${new Intl.NumberFormat("en-IN").format(total)} rows`}
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 700,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                }}
              />
            </Stack>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow
                  sx={{
                    bgcolor: "#1f6d45",
                    "& .MuiTableCell-root": {
                      color: "#fff",
                      fontWeight: 800,
                      borderBottom: "1px solid rgba(255,255,255,0.12)",
                    },
                  }}
                >
                  <TableCell>District</TableCell>
                  <TableCell>Market</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Commodity</TableCell>
                  <TableCell>Variety</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Min Price</TableCell>
                  <TableCell>Max Price</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading || (isFetching && items.length === 0)
                  ? Array.from({ length: pageSize }).map((_, index) => (
                      <TableRow key={`skeleton-${index}`}>
                        {Array.from({ length: 8 }).map((__, cellIndex) => (
                          <TableCell key={`cell-${cellIndex}`}>
                            <Skeleton height={26} />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  : null}

                {!isLoading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Alert severity="info" sx={{ my: 1 }}>
                        No mandi prices matched the selected district, market, commodity, or date
                        window.
                      </Alert>
                    </TableCell>
                  </TableRow>
                ) : null}

                {items.map((item, index) => (
                  <TableRow
                    key={`${item.market}-${item.commodity}-${item.date}-${index}`}
                    hover
                    sx={{
                      "&:nth-of-type(even)": {
                        bgcolor: "rgba(31,84,50,0.02)",
                      },
                    }}
                  >
                    <TableCell>{item.district || "--"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{item.market}</TableCell>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>{item.commodity}</TableCell>
                    <TableCell>{item.variety || "--"}</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>{formatPrice(item.price)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2">{formatPrice(item.min_price)}</Typography>
                        <ArrowDropDownIcon sx={{ color: "#d35a4b" }} />
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="body2">{formatPrice(item.max_price)}</Typography>
                        <ArrowDropUpIcon sx={{ color: "#68a35f" }} />
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handlePageChange}
            rowsPerPage={pageSize}
            onRowsPerPageChange={handleRowsPerPageChange}
            rowsPerPageOptions={[10, 25, 50]}
          />
        </Stack>
      </Paper>
    </Stack>
  );
};

const MandiPricePage: React.FC = () => (
  <AppLayout>
    <MandiPriceContent />
  </AppLayout>
);

export default MandiPricePage;
