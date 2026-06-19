package com.planitask.controller;

import com.lowagie.text.Chunk;
import com.lowagie.text.Document;
import com.lowagie.text.Element;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.jfree.chart.ChartFactory;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.general.DefaultPieDataset;
import com.planitask.entity.MembreProjet;
import com.planitask.entity.Projet;
import com.planitask.entity.Tache;
import com.planitask.entity.Utilisateur;
import com.planitask.enums.FormatRapport;
import com.planitask.enums.StatutTache;
import com.planitask.repository.MembreProjetRepository;
import com.planitask.repository.ProjetRepository;
import com.planitask.repository.TacheRepository;
import com.planitask.service.RapportService;
import com.planitask.service.RapportService.RapportResponse;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/rapports")
@RequiredArgsConstructor
public class RapportController {

    private final RapportService rapportService;
    private final ProjetRepository projetRepository;
    private final TacheRepository tacheRepository;
    private final MembreProjetRepository membreProjetRepository;

    private static final java.awt.Color INDIGO       = new java.awt.Color(99, 102, 241);
    private static final java.awt.Color LIGHT_INDIGO = new java.awt.Color(224, 224, 255);
    private static final java.awt.Color DARK_GRAY    = new java.awt.Color(50, 50, 50);

    // PDF Font aliases to avoid com.lowagie.text.Font vs org.apache.poi.ss.usermodel.Font ambiguity
    private com.lowagie.text.Font pdfFont(int family, float size, int style, java.awt.Color color) {
        return new com.lowagie.text.Font(family, size, style, color);
    }
    private com.lowagie.text.Font pdfFont(int family, float size, int style) {
        return new com.lowagie.text.Font(family, size, style);
    }

    @PostMapping("/generer/{projetId}")
    public ResponseEntity<RapportResponse> generer(
            @PathVariable Long projetId,
            @RequestBody(required = false) GenererRapportRequest request,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        FormatRapport format = (request != null && request.getFormat() != null)
                ? request.getFormat() : FormatRapport.HTML;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(rapportService.generer(projetId, format, utilisateur));
    }

    @GetMapping("/projet/{projetId}")
    public ResponseEntity<List<RapportResponse>> getRapportsProjet(@PathVariable Long projetId) {
        return ResponseEntity.ok(rapportService.getRapportsProjet(projetId));
    }

    // ── Export PDF ────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @GetMapping("/export/pdf")
    public ResponseEntity<byte[]> exportPdf(
            @RequestParam Long projetId,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            Projet projet = projetRepository.findById(projetId)
                    .orElseThrow(() -> new RuntimeException("Projet introuvable"));
            List<Tache> taches = tacheRepository.findByProjetId(projetId);
            List<MembreProjet> membres = membreProjetRepository.findByProjet(projet);

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            Document doc = new Document(PageSize.A4, 36f, 36f, 54f, 36f);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            com.lowagie.text.Font titleFont = pdfFont(com.lowagie.text.Font.HELVETICA, 20, com.lowagie.text.Font.BOLD, INDIGO);
            com.lowagie.text.Font h2Font    = pdfFont(com.lowagie.text.Font.HELVETICA, 14, com.lowagie.text.Font.BOLD, java.awt.Color.BLACK);
            com.lowagie.text.Font labelFont = pdfFont(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.BOLD, DARK_GRAY);
            com.lowagie.text.Font bodyFont  = pdfFont(com.lowagie.text.Font.HELVETICA, 10, com.lowagie.text.Font.NORMAL, java.awt.Color.BLACK);
            com.lowagie.text.Font smallFont = pdfFont(com.lowagie.text.Font.HELVETICA, 9,  com.lowagie.text.Font.NORMAL, DARK_GRAY);

            doc.add(new Paragraph("PlaniTask — Rapport de Projet", titleFont));
            doc.add(new Paragraph("Généré le : " + java.time.LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")), smallFont));
            doc.add(Chunk.NEWLINE);

            doc.add(new Paragraph("Projet : " + projet.getNom(), h2Font));
            if (projet.getDescription() != null && !projet.getDescription().isBlank())
                doc.add(new Paragraph(projet.getDescription(), bodyFont));
            doc.add(Chunk.NEWLINE);

            // KPI table
            PdfPTable kpi = new PdfPTable(2);
            kpi.setWidthPercentage(60);
            kpi.setHorizontalAlignment(Element.ALIGN_LEFT);
            long terminees = taches.stream().filter(t -> StatutTache.TERMINE.equals(t.getStatut())).count();
            addRow(kpi, "Statut",     projet.getStatut().name(), labelFont, bodyFont);
            addRow(kpi, "Avancement", Math.round(projet.getAvancement()) + "%", labelFont, bodyFont);
            addRow(kpi, "Tâches",     taches.size() + " (" + terminees + " terminées)", labelFont, bodyFont);
            addRow(kpi, "Membres",    String.valueOf(membres.size()), labelFont, bodyFont);
            if (projet.getDateFin() != null)
                addRow(kpi, "Échéance", projet.getDateFin().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), labelFont, bodyFont);
            doc.add(kpi);
            doc.add(Chunk.NEWLINE);

            // ── Charts section ────────────────────────────────────────────────
            System.setProperty("java.awt.headless", "true");

            // 1. Pie chart — distribution des statuts
            if (!taches.isEmpty()) {
                doc.add(new Paragraph("Statistiques", h2Font));
                doc.add(Chunk.NEWLINE);

                DefaultPieDataset<String> pieDs = new DefaultPieDataset<>();
                Map<String, Long> byStatut = taches.stream()
                        .collect(Collectors.groupingBy(t -> t.getStatut().name(), Collectors.counting()));
                Map<String, String> statutFr = Map.of(
                        "A_FAIRE", "À faire", "EN_COURS", "En cours",
                        "EN_REVUE", "En révision", "BLOQUEE", "Bloqué", "TERMINE", "Terminé");
                byStatut.forEach((k, v) -> pieDs.setValue(statutFr.getOrDefault(k, k), v));

                JFreeChart pieChart = ChartFactory.createPieChart(
                        "Distribution des statuts", pieDs, true, false, false);
                pieChart.setBackgroundPaint(java.awt.Color.WHITE);
                pieChart.getTitle().setFont(new java.awt.Font("SansSerif", java.awt.Font.BOLD, 14));
                BufferedImage pieImg = pieChart.createBufferedImage(480, 300);
                ByteArrayOutputStream pieOut = new ByteArrayOutputStream();
                ImageIO.write(pieImg, "PNG", pieOut);
                Image pdfPie = Image.getInstance(pieOut.toByteArray());
                pdfPie.setAlignment(Image.ALIGN_CENTER);
                pdfPie.scaleToFit(480, 300);
                doc.add(pdfPie);
                doc.add(Chunk.NEWLINE);

                // 2. Bar chart — progression par tâche
                DefaultCategoryDataset barDs = new DefaultCategoryDataset();
                for (Tache t : taches) {
                    String label = t.getTitre().length() > 22 ? t.getTitre().substring(0, 22) + "…" : t.getTitre();
                    barDs.addValue(t.getProgression() != null ? t.getProgression() : 0, "Progression", label);
                }
                JFreeChart barChart = ChartFactory.createBarChart(
                        "Progression des tâches (%)", "Tâche", "Progression (%)",
                        barDs, PlotOrientation.HORIZONTAL, false, false, false);
                barChart.setBackgroundPaint(java.awt.Color.WHITE);
                barChart.getTitle().setFont(new java.awt.Font("SansSerif", java.awt.Font.BOLD, 14));
                int barH = Math.min(500, 80 + taches.size() * 28);
                BufferedImage barImg = barChart.createBufferedImage(500, barH);
                ByteArrayOutputStream barOut = new ByteArrayOutputStream();
                ImageIO.write(barImg, "PNG", barOut);
                Image pdfBar = Image.getInstance(barOut.toByteArray());
                pdfBar.setAlignment(Image.ALIGN_CENTER);
                pdfBar.scaleToFit(500, barH);
                doc.add(pdfBar);
                doc.add(Chunk.NEWLINE);
            }

            // Tasks table
            if (!taches.isEmpty()) {
                doc.add(new Paragraph("Tâches", h2Font));
                doc.add(Chunk.NEWLINE);
                PdfPTable tt = new PdfPTable(4);
                tt.setWidthPercentage(100);
                tt.setWidths(new float[]{4f, 2f, 2f, 1.5f});
                for (String h : new String[]{"Titre", "Statut", "Priorité", "Progression"}) {
                    PdfPCell c = new PdfPCell(new Phrase(h, labelFont));
                    c.setBackgroundColor(LIGHT_INDIGO);
                    c.setPadding(5f);
                    tt.addCell(c);
                }
                for (Tache t : taches) {
                    tt.addCell(pdfCell(t.getTitre(), bodyFont));
                    tt.addCell(pdfCell(t.getStatut().name(), smallFont));
                    tt.addCell(pdfCell(t.getPriorite().name(), smallFont));
                    tt.addCell(pdfCell(t.getProgression() + "%", bodyFont));
                }
                doc.add(tt);
                doc.add(Chunk.NEWLINE);
            }

            // Members table
            if (!membres.isEmpty()) {
                doc.add(new Paragraph("Équipe", h2Font));
                doc.add(Chunk.NEWLINE);
                PdfPTable mt = new PdfPTable(3);
                mt.setWidthPercentage(80);
                for (String h : new String[]{"Nom", "Email", "Rôle"}) {
                    PdfPCell c = new PdfPCell(new Phrase(h, labelFont));
                    c.setBackgroundColor(LIGHT_INDIGO);
                    c.setPadding(5f);
                    mt.addCell(c);
                }
                for (MembreProjet m : membres) {
                    mt.addCell(pdfCell(m.getUtilisateur().getPrenom() + " " + m.getUtilisateur().getNom(), bodyFont));
                    mt.addCell(pdfCell(m.getUtilisateur().getEmail(), smallFont));
                    mt.addCell(pdfCell(m.getRole().name(), bodyFont));
                }
                doc.add(mt);
            }

            doc.close();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION,
                    "attachment; filename=\"rapport_" + clean(projet.getNom()) + ".pdf\"");
            return ResponseEntity.ok().headers(headers).body(baos.toByteArray());

        } catch (Exception e) {
            log.error("Erreur export PDF projetId={}: {}", projetId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    // ── Export Excel ──────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @GetMapping("/export/excel")
    public ResponseEntity<byte[]> exportExcel(
            @RequestParam Long projetId,
            @AuthenticationPrincipal Utilisateur utilisateur) {
        try {
            Projet projet = projetRepository.findById(projetId)
                    .orElseThrow(() -> new RuntimeException("Projet introuvable"));
            List<Tache> taches = tacheRepository.findByProjetId(projetId);
            List<MembreProjet> membres = membreProjetRepository.findByProjet(projet);

            try (Workbook wb = new XSSFWorkbook()) {
                CellStyle hStyle = headerStyle(wb);

                // Sheet 1 — Projet
                org.apache.poi.ss.usermodel.Sheet s1 = wb.createSheet("Projet");
                String[] ph = {"Nom", "Statut", "Avancement", "Date Début", "Date Fin", "Tâches", "Terminées"};
                xlRow(s1, 0, ph, hStyle);
                long terminees = taches.stream().filter(t -> StatutTache.TERMINE.equals(t.getStatut())).count();
                xlRow(s1, 1, new Object[]{
                        projet.getNom(), projet.getStatut().name(),
                        Math.round(projet.getAvancement()) + "%",
                        fmt(projet.getDateDebut()), fmt(projet.getDateFin()),
                        taches.size(), terminees
                }, null);
                for (int i = 0; i < ph.length; i++) s1.autoSizeColumn(i);

                // Sheet 2 — Tâches
                org.apache.poi.ss.usermodel.Sheet s2 = wb.createSheet("Tâches");
                String[] th = {"Titre", "Statut", "Priorité", "Assigné", "Date Fin", "Progression", "Temps Estimé", "En Retard"};
                xlRow(s2, 0, th, hStyle);
                int ri = 1;
                for (Tache t : taches) {
                    boolean overdue = t.getDateFin() != null
                            && t.getDateFin().isBefore(LocalDate.now())
                            && !StatutTache.TERMINE.equals(t.getStatut());
                    xlRow(s2, ri++, new Object[]{
                            t.getTitre(), t.getStatut().name(), t.getPriorite().name(),
                            t.getAssignee() != null ? t.getAssignee().getPrenom() + " " + t.getAssignee().getNom() : "",
                            fmt(t.getDateFin()), t.getProgression() + "%",
                            t.getTempsEstime() != null ? t.getTempsEstime() + "h" : "",
                            overdue ? "Oui" : "Non"
                    }, null);
                }
                for (int i = 0; i < th.length; i++) s2.autoSizeColumn(i);

                // Sheet 3 — Membres
                org.apache.poi.ss.usermodel.Sheet s3 = wb.createSheet("Membres");
                String[] mh = {"Prénom", "Nom", "Email", "Rôle", "Date d'ajout"};
                xlRow(s3, 0, mh, hStyle);
                int mi = 1;
                for (MembreProjet m : membres) {
                    xlRow(s3, mi++, new Object[]{
                            m.getUtilisateur().getPrenom(), m.getUtilisateur().getNom(),
                            m.getUtilisateur().getEmail(), m.getRole().name(),
                            m.getDateAjout() != null ? m.getDateAjout().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")) : ""
                    }, null);
                }
                for (int i = 0; i < mh.length; i++) s3.autoSizeColumn(i);

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                wb.write(baos);

                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"));
                headers.add(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"rapport_" + clean(projet.getNom()) + ".xlsx\"");
                return ResponseEntity.ok().headers(headers).body(baos.toByteArray());
            }
        } catch (Exception e) {
            log.error("Erreur export Excel projetId={}: {}", projetId, e.getMessage(), e);
            return ResponseEntity.status(500).build();
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private PdfPCell pdfCell(String text, com.lowagie.text.Font font) {
        PdfPCell c = new PdfPCell(new Phrase(text != null ? text : "", font));
        c.setPadding(4f);
        return c;
    }

    private void addRow(PdfPTable table, String label, String value,
                        com.lowagie.text.Font lf, com.lowagie.text.Font vf) {
        PdfPCell lc = new PdfPCell(new Phrase(label, lf));
        lc.setPadding(4f); lc.setBorder(com.lowagie.text.Rectangle.BOTTOM);
        PdfPCell vc = new PdfPCell(new Phrase(value, vf));
        vc.setPadding(4f); vc.setBorder(com.lowagie.text.Rectangle.BOTTOM);
        table.addCell(lc); table.addCell(vc);
    }

    private CellStyle headerStyle(Workbook wb) {
        CellStyle s = wb.createCellStyle();
        // Use fully qualified POI font to avoid ambiguity with com.lowagie.text.Font
        org.apache.poi.ss.usermodel.Font poiFont = wb.createFont();
        poiFont.setBold(true);
        s.setFont(poiFont);
        s.setFillForegroundColor(IndexedColors.CORNFLOWER_BLUE.getIndex());
        s.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return s;
    }

    private void xlRow(org.apache.poi.ss.usermodel.Sheet sheet, int rowIdx, Object[] values, CellStyle style) {
        org.apache.poi.ss.usermodel.Row row = sheet.createRow(rowIdx);
        for (int i = 0; i < values.length; i++) {
            org.apache.poi.ss.usermodel.Cell c = row.createCell(i);
            if (values[i] instanceof Number) c.setCellValue(((Number) values[i]).doubleValue());
            else c.setCellValue(values[i] != null ? values[i].toString() : "");
            if (style != null) c.setCellStyle(style);
        }
    }

    private String fmt(Object d) {
        if (d == null) return "";
        return d.toString();
    }

    private String clean(String s) {
        return s == null ? "rapport" : s.replaceAll("[^a-zA-Z0-9À-ÿ]", "_");
    }

    @Data
    static class GenererRapportRequest {
        private FormatRapport format;
    }
}
