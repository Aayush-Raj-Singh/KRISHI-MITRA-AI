import React, { useMemo } from "react";
import {
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import LinkIcon from "@mui/icons-material/Link";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import SupportAgentIcon from "@mui/icons-material/SupportAgent";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import AppLayout from "../components/common/AppLayout";
import AgricultureHero from "../components/common/AgricultureHero";

const NoticesPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const notices = useMemo(
    () => [
      {
        title: t("dashboard_page.notices.item_1_title"),
        date: t("dashboard_page.notices.item_1_date")
      },
      {
        title: t("dashboard_page.notices.item_2_title"),
        date: t("dashboard_page.notices.item_2_date")
      },
      {
        title: t("dashboard_page.notices.item_3_title"),
        date: t("dashboard_page.notices.item_3_date")
      },
      {
        title: t("dashboard_page.notices.item_4_title"),
        date: t("dashboard_page.notices.item_4_date")
      }
    ],
    [t]
  );

  const importantLinks = useMemo(
    () => [
      { label: t("dashboard_page.links.beneficiary_status"), icon: <CheckCircleIcon color="success" /> },
      { label: t("dashboard_page.links.farmer_registration"), icon: <AgricultureIcon color="primary" /> },
      { label: t("dashboard_page.links.market_price_bulletin"), icon: <TrendingUpIcon color="secondary" /> },
      { label: t("dashboard_page.links.helpline_support"), icon: <SupportAgentIcon color="primary" /> }
    ],
    [t]
  );

  return (
    <AppLayout>
      <Stack spacing={3}>
        <AgricultureHero
          icon={<CampaignIcon color="secondary" />}
          title={t("dashboard_page.notices.title")}
          subtitle={t("dashboard_page.advisory_tip.description")}
          badges={[
            t("dashboard_page.notices.item_1_date"),
            t("dashboard_page.notices.item_2_date"),
            t("dashboard_page.notices.item_3_date")
          ]}
          imageSrc="/assets/agri-slider/slide-05.jpg"
        />

        <Grid container spacing={3}>
          <Grid item xs={12} md={7}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <CampaignIcon color="secondary" />
                  <Typography variant="h6">{t("dashboard_page.notices.title")}</Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <List>
                  {notices.map((notice) => (
                    <ListItem key={notice.title} disableGutters>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={notice.title}
                        secondary={<Typography variant="caption">{notice.date}</Typography>}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={5}>
            <Card sx={{ height: "100%" }}>
              <CardContent>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <LinkIcon color="secondary" />
                  <Typography variant="h6">{t("dashboard_page.links.title")}</Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  {importantLinks.map((item) => (
                    <Button
                      key={item.label}
                      variant="outlined"
                      startIcon={item.icon}
                      fullWidth
                      onClick={() => navigate("/services")}
                    >
                      {item.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Stack>
    </AppLayout>
  );
};

export default NoticesPage;
