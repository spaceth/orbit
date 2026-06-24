import type { Locale } from "@/lib/localization";

export interface SatelliteLocalizedContent {
  description?: string;
}

export interface FutureSatelliteLocalizedContent {
  description: string;
}

export const SATELLITE_I18N: Record<Locale, Record<number, SatelliteLocalizedContent>> = {
  en: {
    58016: {
      description:
        "THEOS-2 is Thailand’s high-resolution Earth observation satellite, developed with Airbus and operated by GISTDA. It provides satellite imagery for mapping, agriculture, forestry, water management, urban planning, and disaster response.",
    },
    67683: {
      description:
        "KnackSat-2 is a Thai CubeSat developed by King Mongkut’s University of Technology North Bangkok. Deployed from the International Space Station in 2026, it supports education, satellite engineering, and hands-on space technology development in Thailand.",
    },
    33396: {
      description:
        "THEOS is Thailand’s first Earth observation satellite, launched in 2008 and operated by GISTDA. It provided satellite imagery for mapping, agriculture, natural resource management, disaster monitoring, and national planning.",
    },
    28786: {
      description:
        "Thaicom 4, also known as IPSTAR, is a Thai communications satellite launched in 2005. It was designed as a high-throughput satellite to provide broadband internet and data services across Asia-Pacific, especially in remote and underserved areas.",
    },
    39500: {
      description:
        "Thaicom 6 is a Thai communications satellite launched in 2014. Operating in geostationary orbit, it supports television broadcasting and telecommunications services for Thailand and the wider region.",
    },
    40141: {
      description:
        "Thaicom 7 is a Thai communications satellite launched in 2014. It provides additional regional capacity for broadcasting and telecommunications services across Asia-Pacific.",
    },
    41552: {
      description:
        "Thaicom 8 is a Thai communications satellite launched in 2016. Operating in geostationary orbit, it supports broadcasting and telecommunications services across Thailand and the wider region.",
    },
    48963: {
      description:
        "Napa-2 is an Earth observation satellite developed for the Royal Thai Air Force. Launched in 2021, it supports satellite imaging, surveillance, and security-related operations.",
    },
  },
  th: {
    58016: {
      description:
        "THEOS-2 เป็นดาวเทียมสำรวจโลกความละเอียดสูงของไทย พัฒนาร่วมกับ Airbus และดำเนินงานโดย GISTDA ใช้ถ่ายภาพดาวเทียมเพื่อการทำแผนที่ เกษตร ป่าไม้ การจัดการน้ำ ผังเมือง และการรับมือภัยพิบัติ",
    },
    67683: {
      description:
        "KnackSat-2 เป็นดาวเทียมขนาดเล็กแบบ CubeSat ของไทย พัฒนาโดยมหาวิทยาลัยเทคโนโลยีพระจอมเกล้าพระนครเหนือ และถูกปล่อยจากสถานีอวกาศนานาชาติในปี 2026 เพื่อสนับสนุนการศึกษา วิศวกรรมดาวเทียม และการพัฒนาเทคโนโลยีอวกาศเชิงปฏิบัติในไทย",
    },
    33396: {
      description:
        "THEOS เป็นดาวเทียมสำรวจโลกดวงแรกของไทย ปล่อยขึ้นสู่วงโคจรในปี 2008 และดำเนินงานโดย GISTDA ใช้ให้บริการข้อมูลภาพถ่ายดาวเทียมสำหรับการทำแผนที่ เกษตร การจัดการทรัพยากรธรรมชาติ การติดตามภัยพิบัติ และการวางแผนระดับประเทศ",
    },
    28786: {
      description:
        "Thaicom 4 หรือ IPSTAR เป็นดาวเทียมสื่อสารสัญชาติไทยที่ปล่อยขึ้นสู่อวกาศในปี 2005 ออกแบบเป็นดาวเทียมสื่อสารความจุสูง เพื่อให้บริการอินเทอร์เน็ตบรอดแบนด์และการสื่อสารข้อมูลในภูมิภาคเอเชียแปซิฟิก โดยเฉพาะพื้นที่ห่างไกลหรือพื้นที่ที่โครงข่ายภาคพื้นดินเข้าถึงได้ยาก",
    },
    39500: {
      description:
        "Thaicom 6 เป็นดาวเทียมสื่อสารสัญชาติไทยที่ปล่อยขึ้นสู่อวกาศในปี 2014 ทำงานในวงโคจรค้างฟ้า เพื่อรองรับบริการกระจายสัญญาณโทรทัศน์และโทรคมนาคมในประเทศไทยและภูมิภาคใกล้เคียง",
    },
    40141: {
      description:
        "Thaicom 7 เป็นดาวเทียมสื่อสารสัญชาติไทยที่ปล่อยขึ้นสู่อวกาศในปี 2014 ใช้เพิ่มขีดความสามารถด้านการกระจายสัญญาณและบริการโทรคมนาคมในภูมิภาคเอเชียแปซิฟิก",
    },
    41552: {
      description:
        "Thaicom 8 เป็นดาวเทียมสื่อสารสัญชาติไทยที่ปล่อยขึ้นสู่อวกาศในปี 2016 ทำงานในวงโคจรค้างฟ้า เพื่อรองรับบริการกระจายสัญญาณโทรทัศน์และโทรคมนาคมในประเทศไทยและภูมิภาคใกล้เคียง",
    },
    48963: {
      description:
        "Napa-2 เป็นดาวเทียมสำรวจโลกที่พัฒนาขึ้นสำหรับกองทัพอากาศไทย ปล่อยขึ้นสู่อวกาศในปี 2021 เพื่อสนับสนุนงานด้านภาพถ่ายดาวเทียม การเฝ้าระวัง และภารกิจด้านความมั่นคง",
    },
  },
};

export const FUTURE_SATELLITE_I18N: Record<
  Locale,
  Record<string, FutureSatelliteLocalizedContent>
> = {
  en: {
    "tsc-1": {
      description:
        "TSC-1 is a Thai technology demonstration satellite developed by the National Astronomical Research Institute of Thailand. It is intended to test satellite systems and support the development of local capabilities in communications, navigation, and Earth observation technologies.",
    },
    "theos-3": {
      description:
        "THEOS-3 is Thailand’s planned next-generation Earth observation satellite, continuing the country’s remote sensing program after THEOS and THEOS-2. It is expected to support mapping, agriculture, environmental monitoring, and disaster response.",
    },
  },
  th: {
    "tsc-1": {
      description:
        "TSC-1 เป็นดาวเทียมสาธิตเทคโนโลยีของไทย พัฒนาโดยสถาบันวิจัยดาราศาสตร์แห่งชาติ หรือ NARIT มีเป้าหมายเพื่อทดสอบระบบดาวเทียมและสนับสนุนการพัฒนาความสามารถในประเทศด้านการสื่อสาร การนำทาง และเทคโนโลยีสำรวจโลก",
    },
    "theos-3": {
      description:
        "THEOS-3 เป็นดาวเทียมสำรวจโลกรุ่นถัดไปที่อยู่ในแผนของไทย ต่อยอดจาก THEOS และ THEOS-2 เพื่อสนับสนุนงานด้าน Remote Sensing เช่น การทำแผนที่ เกษตร การติดตามสิ่งแวดล้อม และการรับมือภัยพิบัติ",
    },
  },
};

export function getSatelliteDescription(locale: Locale, noradId: number): string | undefined {
  return SATELLITE_I18N[locale][noradId]?.description;
}

export function getFutureSatelliteDescription(locale: Locale, id: string): string | undefined {
  return FUTURE_SATELLITE_I18N[locale][id]?.description;
}