/**
 * TerraVeil — Premium PDF Report Generator
 *
 * Generates a professional, multi-section climate risk intelligence report
 * using jsPDF for crisp vector text/tables and html2canvas for map capture.
 *
 * Sections:
 *   1. Report Header (branded)
 *   2. Executive Summary
 *   3. Risk Assessment
 *   4. Flood Analysis
 *   5. Infrastructure Impact
 *   6. 72H Forecast
 *   7. Drought Assessment
 *   8. Orbital Consensus
 *   9. Recommendations
 *  10. Methodology & Citations
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// ─── Color Palette ───────────────────────────────────────────────
const COLORS = {
    black: [15, 15, 20],
    darkGray: [30, 30, 35],
    medGray: [60, 60, 65],
    lightGray: [140, 140, 150],
    white: [255, 255, 255],
    silver: [200, 200, 210],
    accent: [59, 130, 246],    // blue
    success: [74, 222, 128],    // green
    warning: [251, 191, 36],    // amber
    danger: [248, 113, 113],   // red
    critical: [239, 68, 68],     // bright red
    purple: [168, 85, 247],    // ML purple
    cyan: [34, 211, 238],    // satellite cyan
};

const RISK_COLORS = {
    LOW: COLORS.success,
    MEDIUM: COLORS.warning,
    HIGH: [249, 115, 22],
    CRITICAL: COLORS.critical,
};

// ─── Utility Functions ───────────────────────────────────────────
function setColor(doc, color, alpha = 1) {
    doc.setTextColor(color[0], color[1], color[2]);
}

function drawRect(doc, x, y, w, h, color, radius = 0) {
    doc.setFillColor(color[0], color[1], color[2]);
    if (radius > 0) {
        doc.roundedRect(x, y, w, h, radius, radius, 'F');
    } else {
        doc.rect(x, y, w, h, 'F');
    }
}

function drawLine(doc, x1, y1, x2, y2, color = COLORS.medGray, width = 0.3) {
    doc.setDrawColor(color[0], color[1], color[2]);
    doc.setLineWidth(width);
    doc.line(x1, y1, x2, y2);
}

/**
 * Generate the full TerraVeil report PDF.
 *
 * @param {Object} data - Normalized scan data from the dashboard
 * @param {HTMLElement} mapElement - DOM element for the map to screenshot
 * @returns {Promise<void>}
 */
export async function generateReport(data, mapElement) {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;   // A4 width
    const H = 297;   // A4 height
    const M = 15;     // margin
    const CW = W - 2 * M; // content width
    let y = 0;

    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';

    // ═══════════════════════════════════════════════════════════════
    // PAGE 1: Cover + Executive Summary + Risk
    // ═══════════════════════════════════════════════════════════════

    // ── Dark header bar ──
    drawRect(doc, 0, 0, W, 52, COLORS.black);
    drawRect(doc, 0, 52, W, 1.5, COLORS.accent);

    // Logo/brand
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, COLORS.medGray);
    doc.text('◆', M, 14);
    doc.setFontSize(22);
    setColor(doc, COLORS.white);
    doc.text('TERRAVEIL', M + 5, 15);
    doc.setFontSize(8);
    setColor(doc, COLORS.lightGray);
    doc.text('ORBITAL EDGE INTELLIGENCE', M + 5, 21);

    // Report type badge
    const riskLevel = data.risk_level || 'MEDIUM';
    const badgeColor = RISK_COLORS[riskLevel] || COLORS.warning;
    drawRect(doc, W - M - 45, 8, 45, 8, badgeColor, 2);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text(`${riskLevel} RISK`, W - M - 22.5, 13.5, { align: 'center' });

    // Report title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.white);
    doc.text('Climate Risk Intelligence Report', M, 33);

    // Metadata line
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.lightGray);
    doc.text(`Region: ${data.region || 'Unknown'}  ·  Period: ${data.period || 'N/A'}  ·  Generated: ${timestamp}`, M, 40);

    // Classification
    doc.setFontSize(7);
    setColor(doc, COLORS.medGray);
    doc.text(`Report ID: TV-${Date.now().toString(36).toUpperCase()}  ·  Classification: RESTRICTED  ·  Confidence: ${(data.confidence || 0).toFixed(2)}`, M, 47);

    y = 62;

    // ── Executive Summary ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('EXECUTIVE SUMMARY', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.accent, 0.5);
    y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.darkGray);
    const summaryText = `TerraVeil analyzed satellite imagery from the European Space Agency's Sentinel constellation ` +
        `for the ${data.region || 'target'} region. The analysis combined Sentinel-2 multispectral optical data with ` +
        `Sentinel-1 SAR radar for cloud-penetrating capability. Physics-based spectral indices (NDWI, NDVI, NDDI) ` +
        `were ensembled with a U-Net deep learning model (MobileNetV2 backbone) across 3 orbital nodes to produce ` +
        `a consensus flood detection with ${((data.confidence || 0) * 100).toFixed(0)}% confidence.`;
    const summaryLines = doc.splitTextToSize(summaryText, CW);
    doc.text(summaryLines, M, y);
    y += summaryLines.length * 4.5 + 4;

    // ── Key Metrics Row ──
    drawRect(doc, M, y, CW, 22, [245, 247, 250], 3);
    const metrics = [
        { label: 'RISK SCORE', value: `${data.risk_score || 0}`, sub: `/100 · ${riskLevel}`, color: badgeColor },
        { label: 'FLOOD AREA', value: `${data.flood_area_km2 || 0}`, sub: 'km²', color: COLORS.cyan },
        { label: 'POPULATION', value: `${(data.pop_affected || 0).toLocaleString()}`, sub: 'at risk', color: COLORS.danger },
        { label: 'HOSPITALS', value: `${data.hospitals_at_risk || 0}`, sub: 'at risk', color: COLORS.warning },
        { label: 'CONFIDENCE', value: `${((data.confidence || 0) * 100).toFixed(0)}%`, sub: `band [${data.confidence_lower?.toFixed(2) || '—'}–${data.confidence_upper?.toFixed(2) || '—'}]`, color: COLORS.success },
    ];
    const colW = CW / metrics.length;
    metrics.forEach((m, i) => {
        const cx = M + i * colW + colW / 2;
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.medGray);
        doc.text(m.label, cx, y + 6, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        setColor(doc, m.color);
        doc.text(m.value, cx, y + 14, { align: 'center' });

        doc.setFontSize(6);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.lightGray);
        doc.text(m.sub, cx, y + 18, { align: 'center' });
    });
    y += 28;

    // ── Map Capture ──
    if (mapElement) {
        try {
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            setColor(doc, COLORS.black);
            doc.text('FLOOD DETECTION MAP', M, y);
            drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.cyan, 0.5);
            y += 5;

            const canvas = await html2canvas(mapElement, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: '#0f0f14',
                logging: false,
            });
            const imgData = canvas.toDataURL('image/jpeg', 0.85);
            const imgW = CW;
            const imgH = (canvas.height / canvas.width) * imgW;
            const maxImgH = 85;
            const finalH = Math.min(imgH, maxImgH);

            // Border
            drawRect(doc, M - 0.5, y - 0.5, imgW + 1, finalH + 1, COLORS.medGray, 2);
            doc.addImage(imgData, 'JPEG', M, y, imgW, finalH);
            y += finalH + 4;

            // Map metadata
            doc.setFontSize(6);
            setColor(doc, COLORS.lightGray);
            doc.text(`Bbox: N${data.bbox?.north || '—'} S${data.bbox?.south || '—'} E${data.bbox?.east || '—'} W${data.bbox?.west || '—'}  ·  Tile Source: © CARTO / OpenStreetMap  ·  Overlay: NDWI Flood Mask`, M, y);
            y += 6;
        } catch (e) {
            console.warn('Map capture failed:', e);
            y += 4;
        }
    }

    // ── Risk Assessment Table ──
    if (y > 235) { doc.addPage(); y = M; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('RISK CLASSIFICATION', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, badgeColor, 0.5);
    y += 7;

    const riskComponents = data.risk_components || {};
    const riskRows = [
        ['Flood Area Coverage', `${riskComponents.area?.toFixed(1) || '—'}/100`, '30%'],
        ['NDWI Signal Intensity', `${riskComponents.ndwi?.toFixed(1) || '—'}/100`, '20%'],
        ['Population Exposure', `${riskComponents.population?.toFixed(1) || '—'}/100`, '25%'],
        ['Infrastructure Exposure', `${riskComponents.infrastructure?.toFixed(1) || '—'}/100`, '15%'],
        ['72H Forecast Risk', `${riskComponents.forecast?.toFixed(1) || '—'}/100`, '10%'],
    ];

    // Table header
    drawRect(doc, M, y, CW, 6, [240, 242, 245]);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.medGray);
    doc.text('COMPONENT', M + 3, y + 4);
    doc.text('SCORE', M + 110, y + 4);
    doc.text('WEIGHT', M + 150, y + 4);
    y += 7;

    riskRows.forEach((row, i) => {
        if (i % 2 === 0) drawRect(doc, M, y - 3, CW, 6, [250, 251, 253]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.darkGray);
        doc.text(row[0], M + 3, y);
        doc.setFont('helvetica', 'bold');
        doc.text(row[1], M + 110, y);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.lightGray);
        doc.text(row[2], M + 150, y);
        y += 6;
    });

    // Total row
    drawRect(doc, M, y - 3, CW, 7, COLORS.black);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.white);
    doc.text('COMPOSITE RISK SCORE', M + 3, y + 1);
    setColor(doc, badgeColor);
    doc.text(`${data.risk_score || 0} / 100  —  ${riskLevel}`, M + 110, y + 1);
    y += 12;

    // ═══════════════════════════════════════════════════════════════
    // PAGE 2: Infrastructure + Forecast + Drought + Methodology
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    y = M;

    // Page 2 header bar
    drawRect(doc, 0, 0, W, 10, COLORS.black);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.lightGray);
    doc.text('TERRAVEIL  ·  CLIMATE RISK INTELLIGENCE REPORT', M, 7);
    doc.text(`Page 2  ·  ${data.region || ''}`, W - M, 7, { align: 'right' });
    drawRect(doc, 0, 10, W, 0.5, COLORS.accent);
    y = 18;

    // ── Infrastructure Impact ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('INFRASTRUCTURE IMPACT ASSESSMENT', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.warning, 0.5);
    y += 7;

    // Infrastructure summary cards
    const infraItems = [
        { icon: '🏥', label: 'Hospitals at Risk', value: data.hospitals_at_risk || 0, color: COLORS.danger },
        { icon: '🏫', label: 'Schools in Zone', value: data.infrastructure?.schools?.length || 0, color: COLORS.warning },
        { icon: '🌉', label: 'Bridges Exposed', value: data.infrastructure?.bridges?.length || 0, color: [249, 115, 22] },
        { icon: '🚰', label: 'Water Treatment', value: data.infrastructure?.water_treatment?.length || 0, color: COLORS.cyan },
        { icon: '🛣️', label: 'Roads Affected', value: `${data.roads_km || 0} km`, color: COLORS.lightGray },
    ];

    const cardWidth = (CW - 8) / 5;
    infraItems.forEach((item, i) => {
        const cx = M + i * (cardWidth + 2);
        drawRect(doc, cx, y, cardWidth, 18, [245, 247, 250], 2);

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.medGray);
        doc.text(item.label, cx + cardWidth / 2, y + 5, { align: 'center' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        setColor(doc, item.color);
        doc.text(String(item.value), cx + cardWidth / 2, y + 14, { align: 'center' });
    });
    y += 24;

    // Infrastructure details table
    const infraTypes = [
        { key: 'hospitals', label: 'Hospitals' },
        { key: 'schools', label: 'Schools' },
        { key: 'bridges', label: 'Bridges' },
        { key: 'water_treatment', label: 'Water Treatment' },
    ];

    for (const type of infraTypes) {
        const items = data.infrastructure?.[type.key] || [];
        if (items.length === 0) continue;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.darkGray);
        doc.text(`${type.label} (${items.length})`, M, y + 1);

        drawRect(doc, M, y + 3, CW, 5, [240, 242, 245]);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.medGray);
        doc.text('NAME', M + 3, y + 6.5);
        doc.text('COORDINATES', M + 110, y + 6.5);
        doc.text('STATUS', M + 155, y + 6.5);
        y += 9;

        const maxItems = Math.min(items.length, 5);
        for (let i = 0; i < maxItems; i++) {
            const item = items[i];
            if (i % 2 === 0) drawRect(doc, M, y - 2.5, CW, 5, [250, 251, 253]);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            setColor(doc, COLORS.darkGray);
            const name = (item.name || item.properties?.name || 'Unnamed').substring(0, 45);
            doc.text(name, M + 3, y);
            setColor(doc, COLORS.lightGray);
            const lat = item.lat?.toFixed(4) || item.geometry?.coordinates?.[1]?.toFixed(4) || '—';
            const lon = item.lon?.toFixed(4) || item.geometry?.coordinates?.[0]?.toFixed(4) || '—';
            doc.text(`${lat}, ${lon}`, M + 110, y);
            doc.setFont('helvetica', 'bold');
            setColor(doc, COLORS.danger);
            doc.text('AT RISK', M + 155, y);
            y += 5;
        }
        if (items.length > 5) {
            doc.setFontSize(6);
            setColor(doc, COLORS.lightGray);
            doc.text(`+ ${items.length - 5} more ${type.label.toLowerCase()}`, M + 3, y);
            y += 4;
        }
        y += 3;
    }

    // ── 72-Hour Forecast ──
    if (y > 220) { doc.addPage(); y = M + 15; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('72-HOUR FLOOD RISK FORECAST', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.danger, 0.5);
    y += 8;

    drawRect(doc, M, y, CW, 24, [245, 247, 250], 3);
    const forecastScore = data.forecast?.score || 0;
    const forecastRec = data.forecast?.recommendation || 'Standard monitoring.';

    // Forecast score
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.medGray);
    doc.text('FORECAST RISK SCORE', M + 5, y + 5);
    doc.setFontSize(20);
    const fColor = forecastScore > 75 ? COLORS.critical : forecastScore > 50 ? [249, 115, 22] : forecastScore > 25 ? COLORS.warning : COLORS.success;
    setColor(doc, fColor);
    doc.text(`${forecastScore}`, M + 5, y + 17);
    doc.setFontSize(8);
    setColor(doc, COLORS.lightGray);
    doc.text('/ 100', M + 25, y + 17);

    // Recommendation
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.medGray);
    doc.text('RECOMMENDATION', M + 60, y + 5);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.darkGray);
    const recLines = doc.splitTextToSize(forecastRec, CW - 65);
    doc.text(recLines, M + 60, y + 11);
    y += 30;

    // Forecast components
    const forecastDetails = [
        ['NDWI Trend Analysis', 'Wetting trend slope computed across multi-temporal NDWI values', '35%'],
        ['Rainfall Forecast', `${data.forecast?.rainfall_mm || '—'} mm predicted (OpenMeteo NWP model)`, '35%'],
        ['Elevation Factor', 'Terrain height vulnerability (lower elevation = higher risk)', '30%'],
    ];

    forecastDetails.forEach((row, i) => {
        if (i % 2 === 0) drawRect(doc, M, y - 2.5, CW, 5.5, [250, 251, 253]);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.darkGray);
        doc.text(row[0], M + 3, y);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.lightGray);
        doc.text(row[1], M + 55, y);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.accent);
        doc.text(row[2], M + 165, y);
        y += 6;
    });
    y += 5;

    // ── Drought Assessment ──
    if (y > 235) { doc.addPage(); y = M + 15; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('DROUGHT SEVERITY ASSESSMENT', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.warning, 0.5);
    y += 8;

    drawRect(doc, M, y, CW / 2 - 2, 16, [245, 247, 250], 2);
    drawRect(doc, M + CW / 2 + 2, y, CW / 2 - 2, 16, [245, 247, 250], 2);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.medGray);
    doc.text('NDDI (DROUGHT INDEX)', M + 5, y + 5);
    doc.setFontSize(14);
    setColor(doc, COLORS.warning);
    doc.text(`${data.drought?.nddi_mean?.toFixed(4) || '0.0000'}`, M + 5, y + 13);

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.medGray);
    doc.text('SEVERITY CLASSIFICATION', M + CW / 2 + 7, y + 5);
    doc.setFontSize(14);
    const severity = data.drought?.severity || 'NORMAL';
    const sevColor = severity === 'EMERGENCY' ? COLORS.critical : severity === 'WARNING' ? COLORS.warning : severity === 'WATCH' ? [249, 115, 22] : COLORS.success;
    setColor(doc, sevColor);
    doc.text(severity, M + CW / 2 + 7, y + 13);

    y += 22;

    // ═══════════════════════════════════════════════════════════════
    // PAGE 3: Methodology + Consensus + Citations
    // ═══════════════════════════════════════════════════════════════
    doc.addPage();
    y = M;

    // Page 3 header
    drawRect(doc, 0, 0, W, 10, COLORS.black);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.lightGray);
    doc.text('TERRAVEIL  ·  CLIMATE RISK INTELLIGENCE REPORT', M, 7);
    doc.text(`Page 3  ·  Methodology & References`, W - M, 7, { align: 'right' });
    drawRect(doc, 0, 10, W, 0.5, COLORS.accent);
    y = 18;

    // ── Orbital Consensus ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('DISTRIBUTED ORBITAL CONSENSUS', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.purple, 0.5);
    y += 8;

    const nodes = data.nodes || [];
    if (nodes.length > 0) {
        drawRect(doc, M, y, CW, 5, [240, 242, 245]);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.medGray);
        doc.text('NODE', M + 3, y + 3.5);
        doc.text('TYPE', M + 45, y + 3.5);
        doc.text('CONFIDENCE', M + 85, y + 3.5);
        doc.text('COMPUTE', M + 115, y + 3.5);
        doc.text('FLOOD AREA', M + 145, y + 3.5);
        y += 6;

        nodes.forEach((node, i) => {
            if (i % 2 === 0) drawRect(doc, M, y - 2.5, CW, 5, [250, 251, 253]);
            const isML = node.is_ml;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            setColor(doc, isML ? COLORS.purple : COLORS.darkGray);
            doc.text(node.node_id, M + 3, y);
            doc.setFont('helvetica', 'normal');
            setColor(doc, COLORS.lightGray);
            doc.text(isML ? 'Deep Learning' : 'SAR/Optical', M + 45, y);
            doc.setFont('helvetica', 'bold');
            setColor(doc, COLORS.success);
            doc.text(node.confidence?.toFixed(2) || '—', M + 85, y);
            setColor(doc, COLORS.darkGray);
            doc.text(`${node.compute_ms || '—'}ms`, M + 115, y);
            doc.text(`${node.flood_area_km2 || '—'} km²`, M + 145, y);
            y += 5.5;
        });

        // Consensus summary
        drawRect(doc, M, y, CW, 6, COLORS.black);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.white);
        doc.text(`BAYESIAN WEIGHTED CONSENSUS  ·  ${nodes.length}/${nodes.length} responding  ·  Method: Confidence-weighted mean`, M + 3, y + 4);
        y += 12;
    }

    // ── ML Ensemble ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('AI ENSEMBLE METHODOLOGY', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.purple, 0.5);
    y += 8;

    const mlInfo = data.ml_ensemble || {};
    drawRect(doc, M, y, CW, 22, [245, 247, 250], 3);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.darkGray);
    const mlText = `TerraVeil employs a dual-path detection architecture. The physics path computes NDWI spectral indices ` +
        `and SAR backscatter thresholds. The AI path runs a U-Net convolutional neural network with MobileNetV2 encoder ` +
        `(6.6M parameters, ImageNet pre-trained). When both paths independently agree on flood classification, ` +
        `the ensemble confidence is boosted. Disagreement zones are flagged for manual review.`;
    const mlLines = doc.splitTextToSize(mlText, CW - 10);
    doc.text(mlLines, M + 5, y + 5);
    y += 28;

    // ── Methodology Pipeline ──
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('PROCESSING PIPELINE', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.accent, 0.5);
    y += 8;

    const pipeline = [
        ['01', 'SATELLITE INGESTION', 'Sentinel-2 L2A (optical) + Sentinel-1 GRD (SAR) via Google Earth Engine'],
        ['02', 'NDWI COMPUTATION', 'Normalized Difference Water Index: (Green - NIR) / (Green + NIR)'],
        ['03', 'SAR ANALYSIS', 'VV backscatter Otsu thresholding for cloud-immune flood detection'],
        ['3.5', 'ML ENSEMBLE', 'U-Net MobileNetV2 inference + agreement-based confidence fusion'],
        ['04', 'CHANGE DETECTION', 'Delta NDWI between baseline (T0) and event (T1) periods'],
        ['05', 'ORBITAL INFERENCE', '3 distributed satellite nodes process independent tile regions'],
        ['06', 'CONSENSUS', 'Bayesian weighted consensus across orbital inference packets'],
        ['07', 'INFRASTRUCTURE', 'OpenStreetMap query for hospitals, schools, bridges, roads in flood zone'],
        ['08', 'RISK CLASSIFICATION', 'Weighted composite score: area + NDWI + population + infrastructure + forecast'],
        ['09', '72H FORECAST', 'NDWI trend + OpenMeteo rainfall + elevation factor composite'],
        ['10', 'REPORT GENERATION', `Completed in ${(data.processing_ms / 1000).toFixed(1)}s`],
    ];

    pipeline.forEach((row, i) => {
        if (i % 2 === 0) drawRect(doc, M, y - 2.5, CW, 5, [250, 251, 253]);
        const isML = row[0] === '3.5';
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, isML ? COLORS.purple : COLORS.accent);
        doc.text(row[0], M + 3, y);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.darkGray);
        doc.text(row[1], M + 15, y);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.lightGray);
        doc.text(row[2], M + 60, y);
        y += 5;
    });
    y += 5;

    // ── Research Citations ──
    if (y > 220) { doc.addPage(); y = M + 15; }

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    setColor(doc, COLORS.black);
    doc.text('SCIENTIFIC REFERENCES', M, y);
    drawLine(doc, M, y + 2, M + CW, y + 2, COLORS.accent, 0.5);
    y += 7;

    const citations = [
        'McFeeters, S.K. (1996). "The Use of NDWI in the Delineation of Open Water Features." Intl. J. Remote Sensing, 17(7), 1425-1432.',
        'Rouse, J.W. et al. (1974). "Monitoring Vegetation Systems in the Great Plains with ERTS." NASA SP-351, 309-317.',
        'Gu, Y. et al. (2007). "MODIS NDVI and NDWI for Grassland Drought Assessment." Geophysical Research Letters, 34, L06407.',
        'Twele, A. et al. (2016). "Sentinel-1-based Flood Mapping: A Fully Automated Processing Chain." Intl. J. Remote Sensing, 37(13).',
        'Bonafilia, D. et al. (2020). "Sen1Floods11: Deep Learning Flood Algorithms for Sentinel-1." CVPRW, 210-211.',
        'Ronneberger, O. et al. (2015). "U-Net: Convolutional Networks for Biomedical Image Segmentation." MICCAI, 234-241.',
        'Gorelick, N. et al. (2017). "Google Earth Engine: Planetary-scale Geospatial Analysis." Remote Sensing of Environment, 202.',
        'Boeing, G. (2017). "OSMnx: Acquiring, Analyzing Complex Street Networks." Computers, Env. & Urban Systems, 65, 126-139.',
        'Kittler, J. et al. (1998). "On Combining Classifiers." IEEE T-PAMI, 20(3), 226-239.',
    ];

    citations.forEach((cite, i) => {
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        setColor(doc, COLORS.accent);
        doc.text(`[${i + 1}]`, M, y);
        doc.setFont('helvetica', 'normal');
        setColor(doc, COLORS.medGray);
        const citeLines = doc.splitTextToSize(cite, CW - 10);
        doc.text(citeLines, M + 8, y);
        y += citeLines.length * 3.2 + 1.5;
    });

    // ── Footer ──
    y = H - 20;
    drawLine(doc, M, y, M + CW, y, COLORS.lightGray, 0.2);
    y += 4;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    setColor(doc, COLORS.lightGray);
    doc.text('This report was automatically generated by TerraVeil Orbital Edge Intelligence platform.', M, y);
    doc.text('Data sources: ESA Copernicus (Sentinel-1, Sentinel-2), OpenMeteo, OpenStreetMap. Processing: Physics + AI ensemble.', M, y + 3);
    doc.text(`Generated: ${timestamp}  ·  Classification: RESTRICTED  ·  © ${now.getFullYear()} TerraVeil`, M, y + 6);

    // Also add footer to page 1
    for (let p = 1; p <= doc.getNumberOfPages(); p++) {
        doc.setPage(p);
        drawLine(doc, M, H - 8, M + CW, H - 8, COLORS.lightGray, 0.2);
        doc.setFontSize(6);
        setColor(doc, COLORS.lightGray);
        doc.text(`TerraVeil · Page ${p} of ${doc.getNumberOfPages()}`, M, H - 5);
        doc.text(`${data.region || ''} · ${timestamp}`, W - M, H - 5, { align: 'right' });
    }

    // ── Save ──
    const filename = `TerraVeil_Report_${(data.region || 'Analysis').replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);

    return filename;
}
