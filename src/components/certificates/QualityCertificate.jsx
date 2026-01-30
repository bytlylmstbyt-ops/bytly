import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Award, CheckCircle, Download, FileCheck } from "lucide-react";
import { jsPDF } from "jspdf";
import Logo from "@/components/Logo";

export default function QualityCertificate({ project, technicalReview, consultant }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [client, setClient] = useState(null);
  const [engineer, setEngineer] = useState(null);

  useEffect(() => {
    loadData();
  }, [project]);

  const loadData = async () => {
    if (!project) return;

    const [clientData] = await base44.entities.Client.filter({ id: project.client_id });
    const [engineerData] = await base44.entities.Engineer.filter({ id: project.assigned_engineer_id });
    
    setClient(clientData);
    setEngineer(engineerData);
  };

  const generateCertificatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Background - Light cream color
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, pageWidth, pageHeight, "F");

      // Decorative border - Brown/Gold
      doc.setDrawColor(139, 115, 85);
      doc.setLineWidth(2);
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      doc.setDrawColor(201, 166, 107);
      doc.setLineWidth(0.5);
      doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

      // Inner decorative elements
      doc.setDrawColor(201, 166, 107);
      doc.setLineWidth(0.3);
      doc.line(margin, 45, pageWidth - margin, 45);
      doc.line(margin, 250, pageWidth - margin, 250);

      // Logo placeholder - Brown circle
      doc.setFillColor(107, 93, 79);
      doc.circle(pageWidth / 2, 30, 8, "F");
      
      // Add custom font support for Arabic (you'd need to include the font file)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("bytly", pageWidth / 2, 32, { align: "center" });

      // Title - Arabic
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(107, 93, 79);
      doc.text("شهادة اعتماد جودة المخططات النهائية", pageWidth / 2, 55, { align: "center" });
      
      // Subtitle - English
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(139, 115, 85);
      doc.text("Final Project Quality & Compliance Certificate", pageWidth / 2, 62, { align: "center" });

      // Certificate Number
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(107, 93, 79);
      const certNumber = `CERT-${project.id.slice(0, 8).toUpperCase()}`;
      doc.text(`Certificate No: ${certNumber}`, pageWidth / 2, 70, { align: "center" });

      // Main Content Box
      let yPos = 80;
      
      // Declaration text
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(50, 50, 50);
      
      const declarationText = `Based on the authority granted to us as an approved consulting firm by the "Bytly" platform, we hereby declare that the final design plans and executive drawings for Project No: ${project.id.slice(0, 8)} have been reviewed and approved.`;
      
      const lines = doc.splitTextToSize(declarationText, contentWidth - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 5 + 10;

      // We confirm section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(107, 93, 79);
      doc.text("We hereby confirm the following:", margin + 5, yPos);
      yPos += 8;

      // Confirmation items
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      
      const confirmations = [
        "Technical Compliance: The plans fully comply with approved engineering and structural standards.",
        "Execution Accuracy: All shop drawings have been inspected and verified to be free of technical errors.",
        "Quality: The project is ready for final handover and meets the client's requirements registered on the platform."
      ];

      confirmations.forEach(item => {
        const itemLines = doc.splitTextToSize(`• ${item}`, contentWidth - 15);
        doc.text(itemLines, margin + 10, yPos);
        yPos += itemLines.length * 5 + 3;
      });

      yPos += 10;

      // Project Details Box
      doc.setFillColor(245, 242, 238);
      doc.setDrawColor(201, 166, 107);
      doc.setLineWidth(0.3);
      doc.rect(margin, yPos, contentWidth, 35, "FD");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(107, 93, 79);
      doc.text("Project Details:", margin + 5, yPos + 7);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Project: ${project.title}`, margin + 5, yPos + 14);
      doc.text(`Client: ${client?.full_name || 'N/A'}`, margin + 5, yPos + 21);
      doc.text(`Engineer: ${engineer?.full_name || 'N/A'}`, margin + 5, yPos + 28);

      yPos += 45;

      // Signatures section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(107, 93, 79);
      doc.text("Signatures & Certification:", margin + 5, yPos);
      yPos += 10;

      // Consultant signature
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text(`Certified Consultant: ${consultant?.full_name || 'N/A'}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Professional Registration No: ${consultant?.engineers_society_membership_number || 'N/A'}`, margin + 5, yPos);
      yPos += 6;
      doc.text(`Final Approval Date: ${new Date().toLocaleDateString('en-GB')}`, margin + 5, yPos);
      yPos += 15;

      // Signature line
      doc.setDrawColor(150, 150, 150);
      doc.setLineWidth(0.3);
      doc.line(margin + 5, yPos, margin + 70, yPos);
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Authorized Signature", margin + 5, yPos + 4);

      // Certificate stamp - decorative
      const stampX = pageWidth - margin - 35;
      const stampY = yPos - 15;
      
      doc.setDrawColor(201, 166, 107);
      doc.setLineWidth(2);
      doc.circle(stampX, stampY, 15);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 93, 79);
      doc.text("BYTLY", stampX, stampY - 3, { align: "center" });
      doc.setFontSize(7);
      doc.text("CERTIFIED", stampX, stampY + 3, { align: "center" });
      doc.setFontSize(6);
      doc.text("QUALITY SEAL", stampX, stampY + 7, { align: "center" });

      // Footer notice
      yPos = pageHeight - 35;
      doc.setFillColor(240, 237, 233);
      doc.rect(margin, yPos, contentWidth, 20, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(107, 93, 79);
      doc.text("Notice from Bytly Platform:", margin + 5, yPos + 6);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      const noticeText = "This certificate is electronically issued through the Bytly platform and has full legal validity. The platform acts as an intermediary to ensure the rights of both parties and does not bear responsibility for the execution of the contract terms. For inquiries, please contact technical support at: bytlylmstbyt@gmail.com";
      const noticeLines = doc.splitTextToSize(noticeText, contentWidth - 10);
      doc.text(noticeLines, margin + 5, yPos + 11);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, pageWidth / 2, pageHeight - 10, { align: "center" });

      // Save PDF
      const fileName = `Quality_Certificate_${project.id.slice(0, 8)}_${Date.now()}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("حدث خطأ أثناء إنشاء الشهادة");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAndApprove = async () => {
    // Generate certificate
    await generateCertificatePDF();

    // Update project status
    await base44.entities.Project.update(project.id, {
      status: "pending_client_approval"
    });

    // Send notification to client
    await base44.entities.Notification.create({
      recipient_email: client?.email,
      title: "تم اعتماد المشروع فنياً",
      message: `تم اعتماد مشروعك "${project.title}" من قبل المستشار الفني وإصدار شهادة الجودة. يرجى مراجعة المخططات النهائية`,
      type: "technical_approved",
      related_project_id: project.id,
      priority: "high"
    });

    // Send notification to engineer
    await base44.entities.Notification.create({
      recipient_email: engineer?.email,
      title: "تم اعتماد المشروع فنياً",
      message: `تم اعتماد مشروعك "${project.title}" من قبل المستشار الفني وإصدار شهادة الجودة`,
      type: "technical_approved",
      related_project_id: project.id,
      priority: "high"
    });

    alert("تم إصدار شهادة الجودة وإشعار العميل بنجاح");
    window.location.reload();
  };

  if (!technicalReview || technicalReview.approval_status !== "approved") {
    return null;
  }

  return (
    <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center flex-shrink-0">
            <Award className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-900 mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              إصدار شهادة الجودة النهائية
            </h3>
            <p className="text-green-800 mb-4">
              المشروع جاهز للتسليم النهائي. قم بإصدار شهادة الجودة الرسمية المعتمدة من المنصة.
            </p>

            <div className="bg-white border border-green-300 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-green-900 mb-2">محتوى الشهادة:</h4>
              <ul className="text-sm text-green-800 space-y-1">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>تأكيد المطابقة الفنية للمعايير الهندسية</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>إثبات دقة التنفيذ وخلو المخططات من الأخطاء</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>توقيع المستشار المعتمد وختم المنصة</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>وثيقة رسمية بتصميم احترافي بصيغة PDF</span>
                </li>
              </ul>
            </div>

            <Button
              onClick={handleGenerateAndApprove}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري إصدار الشهادة...
                </>
              ) : (
                <>
                  <FileCheck className="w-5 h-5 ml-2" />
                  إصدار شهادة الجودة واعتماد التسليم النهائي
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}