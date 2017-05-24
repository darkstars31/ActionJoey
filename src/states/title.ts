import * as Assets from '../assets';

export default class Title extends Phaser.State {
    private backgroundTemplateSprite: Phaser.Sprite = null;
    private googleFontText: Phaser.Text = null;
    private localFontText: Phaser.Text = null;
    private pixelateShader: Phaser.Filter = null;
    private bitmapFontText: Phaser.BitmapText = null;
    private blurXFilter: Phaser.Filter.BlurX = null;
    private blurYFilter: Phaser.Filter.BlurY = null;
    private sfxAudiosprite: Phaser.AudioSprite = null;
    private actionJoey: Phaser.Sprite = null;
    private bullet: Phaser.Sprite = null;
    private shotgun: Phaser.Sprite = null;
    private actionJoeyDirection = false;

    // Define constants
    private SHOT_DELAY = 100; // milliseconds (10 bullets/second)
    private BULLET_SPEED = 1200; // pixels/second
    private NUMBER_OF_BULLETS = 1;
    private lastBulletShotAt = 0;
    private bulletPool = null;

    // This is any[] not string[] due to a limitation in TypeScript at the moment;
    // despite string enums working just fine, they are not officially supported so we trick the compiler into letting us do it anyway.
    private sfxLaserSounds: any[] = null;

    public create(): void {
        this.backgroundTemplateSprite = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, Assets.Images.ImagesBackgroundTemplate.getName());
        this.backgroundTemplateSprite.anchor.setTo(0.5);

        this.googleFontText = this.game.add.text(this.game.world.centerX, this.game.world.centerY - 100, 'Google Web Fonts', {
            font: '50px ' + Assets.GoogleWebFonts.Barrio
        });
        this.googleFontText.anchor.setTo(0.5);

        this.localFontText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, 'Local Fonts + Shaders .frag (Pixelate here)!', {
            font: '30px ' + Assets.CustomWebFonts.Fonts2DumbWebfont.getFamily()
        });
        this.localFontText.anchor.setTo(0.5);

        this.pixelateShader = new Phaser.Filter(this.game, null, this.game.cache.getShader(Assets.Shaders.ShadersPixelate.getName()));
        this.localFontText.filters = [this.pixelateShader];

        this.bitmapFontText = this.game.add.bitmapText(this.game.world.centerX, this.game.world.centerY + 100, Assets.BitmapFonts.FontsFontFnt.getName(), 'Bitmap Fonts + Filters .js (Blur here)!', 40);
        this.bitmapFontText.anchor.setTo(0.5);

        this.blurXFilter = this.game.add.filter(Assets.Scripts.ScriptsBlurX.getName()) as Phaser.Filter.BlurX;
        this.blurXFilter.blur = 8;
        this.blurYFilter = this.game.add.filter(Assets.Scripts.ScriptsBlurY.getName()) as Phaser.Filter.BlurY;
        this.blurYFilter.blur = 2;

        this.bitmapFontText.filters = [this.blurXFilter, this.blurYFilter];

        this.bullet = this.game.add.sprite(null, null, Assets.Images.ImagesBulletPng12.getName());
        this.bullet.anchor.setTo(0.5,0.5);
        this.bulletPool = this.game.add.group();
        this.bulletPool.add(this.bullet);
        this.game.physics.enable(this.bullet, Phaser.Physics.ARCADE);
        this.bullet.kill();
        this.shotgun = this.game.add.sprite(null, null, Assets.Images.ImagesShotgun.getName());
        

        this.actionJoey = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY + 135, Assets.Spritesheets.SpritesheetsActionjoeyspritesheet.getName());
        this.actionJoey.animations.add('walk');
        this.actionJoey.animations.play('walk', 12, true);


        this.game.input.keyboard.addKeyCapture(
            [38,40,37,39, 65, 68, 83]
        );

        this.sfxAudiosprite = this.game.add.audioSprite(Assets.Audiosprites.AudiospritesSfx.getName());

        // This is an example of how you can lessen the verbosity
        let availableSFX = Assets.Audiosprites.AudiospritesSfx.Sprites;
        this.sfxLaserSounds = [
            availableSFX.Laser1,
            availableSFX.Laser2,
            availableSFX.Laser3,
            availableSFX.Laser4,
            availableSFX.Laser5,
            availableSFX.Laser6,
            availableSFX.Laser7,
            availableSFX.Laser8,
            availableSFX.Laser9
        ];

        this.game.sound.play(Assets.Audio.AudioMusic.getName(), 0.2, true);

        this.backgroundTemplateSprite.inputEnabled = true;
        this.backgroundTemplateSprite.events.onInputDown.add(() => {
            this.sfxAudiosprite.play(Phaser.ArrayUtils.getRandomItem(this.sfxLaserSounds));
        });

        this.game.camera.flash(0x000000, 1000);
    }

    public update():void  {
        this.shotgun.position.x = this.actionJoey.position.x - 20;
        this.shotgun.position.y = this.actionJoey.position.y + 40;
        if(this.leftInputIsActive()) {
            
            if(!this.actionJoeyDirection){
                this.actionJoeyDirection = true;
                this.actionJoey.position.x += this.actionJoey.width;
                 this.actionJoey.scale.x = this.actionJoey.scale.x * -1;
            }
                
            this.actionJoey.position.x -= 1.5;

        }
        if(this.rightInputIsActive()) {
             if(this.actionJoeyDirection){
                this.actionJoeyDirection = false;
                 this.actionJoey.position.x += this.actionJoey.width;
                 this.actionJoey.scale.x = this.actionJoey.scale.x * -1;
            }
                
            this.actionJoey.position.x += 1.5;

        }

        if(this.input.keyboard.isDown(83)) {
            this.fireBullet();
        }
    }

    public fireBullet():void {      
        if (this.game.time.now - this.lastBulletShotAt < this.SHOT_DELAY) return;
        this.lastBulletShotAt = this.game.time.now;

        // Get a dead bullet from the pool
        var bullet = this.bulletPool.getFirstDead();

        // If there aren't any bullets available then don't shoot
        if (bullet === null || bullet === undefined) return;

        bullet.revive();

        bullet.checkWorldBounds = true;
        bullet.outOfBoundsKill = true;

        // Set the bullet position to the gun position.
        bullet.reset(this.actionJoey.x, this.actionJoey.y + this.actionJoey.height/2);

        // Shoot it
        bullet.body.velocity.x = this.BULLET_SPEED;
        bullet.body.velocity.y = 0;
      
    }

    public leftInputIsActive():any {
        var isActive = false;

        isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT || Phaser.Keyboard.A);

        return isActive;
    }
    public rightInputIsActive():any {
        var isActive = false;

        isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT || Phaser.Keyboard.D);

        return isActive;
    }
}
